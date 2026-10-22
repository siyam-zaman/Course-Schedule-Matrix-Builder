import * as pdfjsLib from 'pdfjs-dist';
import { OfferingRow } from '../types/schedule';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ColumnBound {
  key: keyof OfferingRow;
  xStart: number;
  xEnd: number;
  centerX: number;
}

interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const KNOWN_COMPOUND_PHRASES: Record<string, keyof OfferingRow> = {
  'course code': 'Course Code',
  'course_code': 'Course Code',
  'course no': 'Course Code',
  'course title': 'Title',
  'course name': 'Title',
  'faculty name': 'Faculty Name',
  'faculty initial': 'Faculty Initial',
  'faculty init': 'Faculty Initial',
  'room 1': 'Room1',
  'room 2': 'Room2',
  'day 1': 'Day1',
  'day 2': 'Day2',
  'time 1': 'Time1',
  'time 2': 'Time2',
};

const SINGLE_HEADER_MAP: Record<string, keyof OfferingRow> = {
  'sl': 'sl',
  'sl.': 'sl',
  'serial': 'sl',
  'program': 'Program',
  'dept': 'Program',
  'department': 'Program',
  'course': 'Course Code',
  'code': 'Course Code',
  'title': 'Title',
  'section': 'Section',
  'sec': 'Section',
  'sec.': 'Section',
  'room1': 'Room1',
  'room2': 'Room2',
  'day1': 'Day1',
  'day2': 'Day2',
  'time1': 'Time1',
  'time2': 'Time2',
  'faculty name': 'Faculty Name',
  'faculty initial': 'Faculty Initial',
  'faculty': 'Faculty Name',
  'instructor': 'Faculty Name',
  'teacher': 'Faculty Name',
  'initial': 'Faculty Initial',
  'credit': 'Credit',
  'credits': 'Credit',
  'cr': 'Credit',
  'cr.': 'Credit',
};

/**
 * Derives column boundaries from header text items found on the page.
 */
function deriveColumnBoundaries(headerItems: RawTextItem[], pageWidth: number): ColumnBound[] {
  const matchedCols: { key: keyof OfferingRow; x: number; width: number }[] = [];
  const usedKeys = new Set<keyof OfferingRow>();

  // Sort items left-to-right
  const sorted = [...headerItems].sort((a, b) => a.x - b.x);
  const consumedIndices = new Set<number>();

  // 1. First pass: single items that directly match compound phrases or single header map
  for (let i = 0; i < sorted.length; i++) {
    const cleanStr = sorted[i].str.trim().toLowerCase();
    if (!cleanStr) continue;

    const matchedKey = KNOWN_COMPOUND_PHRASES[cleanStr] || SINGLE_HEADER_MAP[cleanStr];
    if (matchedKey && !usedKeys.has(matchedKey)) {
      matchedCols.push({
        key: matchedKey,
        x: sorted[i].x,
        width: sorted[i].width || 40,
      });
      usedKeys.add(matchedKey);
      consumedIndices.add(i);
    }
  }

  // 2. Second pass: pairs (horizontally adjacent or vertically stacked within dx < 45pt)
  for (let i = 0; i < sorted.length; i++) {
    if (consumedIndices.has(i)) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      if (consumedIndices.has(j)) continue;
      if (Math.abs(sorted[j].x - sorted[i].x) > 45) break;

      const comb = `${sorted[i].str.trim()} ${sorted[j].str.trim()}`.toLowerCase();
      const combRev = `${sorted[j].str.trim()} ${sorted[i].str.trim()}`.toLowerCase();
      const matchedKey = KNOWN_COMPOUND_PHRASES[comb] || KNOWN_COMPOUND_PHRASES[combRev];

      if (matchedKey && !usedKeys.has(matchedKey)) {
        matchedCols.push({
          key: matchedKey,
          x: Math.min(sorted[i].x, sorted[j].x),
          width: Math.max(sorted[i].width, sorted[j].width) || 40,
        });
        usedKeys.add(matchedKey);
        consumedIndices.add(i);
        consumedIndices.add(j);
        break;
      }
    }
  }

  // 3. Third pass: prefix / keyword matching for remaining single items
  for (let i = 0; i < sorted.length; i++) {
    if (consumedIndices.has(i)) continue;
    const item = sorted[i];
    const cleanStr = item.str.trim().toLowerCase();
    if (!cleanStr) continue;

    for (const [headerWord, key] of Object.entries(SINGLE_HEADER_MAP)) {
      if (!usedKeys.has(key) && (cleanStr === headerWord || cleanStr.startsWith(headerWord))) {
        matchedCols.push({
          key,
          x: item.x,
          width: item.width || 40,
        });
        usedKeys.add(key);
        consumedIndices.add(i);
        break;
      }
    }
  }

  if (matchedCols.length === 0) return [];

  // Sort matched columns by x position
  matchedCols.sort((a, b) => a.x - b.x);

  // Build column boundaries [xStart, xEnd]
  const bounds: ColumnBound[] = [];
  for (let i = 0; i < matchedCols.length; i++) {
    const curr = matchedCols[i];
    const prev = matchedCols[i - 1];
    const next = matchedCols[i + 1];

    let xStart: number;
    let xEnd: number;

    if (i === 0) {
      xStart = 0;
    } else if (prev.key === 'Title') {
      // Title is wide, let it run right up to Section
      xStart = curr.x - 10;
    } else if (prev.key === 'Faculty Name') {
      // Faculty Name is wide, let it run right up to Faculty Initial
      xStart = curr.x - 10;
    } else {
      xStart = (prev.x + prev.width + curr.x) / 2;
    }

    if (i === matchedCols.length - 1) {
      xEnd = Math.max(pageWidth, curr.x + curr.width + 100);
    } else if (curr.key === 'Title') {
      xEnd = next.x - 10;
    } else if (curr.key === 'Faculty Name') {
      xEnd = next.x - 10;
    } else {
      xEnd = (curr.x + curr.width + next.x) / 2;
    }

    bounds.push({
      key: curr.key,
      xStart,
      xEnd,
      centerX: curr.x + curr.width / 2,
    });
  }

  return bounds;
}

/**
 * Assigns a text item to the closest/overlapping column boundary.
 */
function assignToColumn(item: RawTextItem, bounds: ColumnBound[]): keyof OfferingRow | null {
  const itemCenterX = item.x + item.width / 2;

  // Exact range containment
  for (const b of bounds) {
    if (itemCenterX >= b.xStart && itemCenterX <= b.xEnd) {
      return b.key;
    }
  }

  // Fallback: nearest column center
  let nearest: ColumnBound | null = null;
  let minDist = Infinity;
  for (const b of bounds) {
    const dist = Math.abs(itemCenterX - b.centerX);
    if (dist < minDist) {
      minDist = dist;
      nearest = b;
    }
  }

  return nearest ? nearest.key : null;
}

/**
 * Groups raw text items into rows by horizontal alignment (y-coordinate clustering).
 */
function groupItemsIntoRows(items: RawTextItem[], yTolerance = 4.5): RawTextItem[][] {
  if (items.length === 0) return [];

  // Sort descending by Y (top to bottom), then ascending by X (left to right)
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= yTolerance) {
      return a.x - b.x;
    }
    return b.y - a.y;
  });

  const rows: RawTextItem[][] = [];
  let currentRow: RawTextItem[] = [];
  let currentY = sorted[0].y;

  for (const item of sorted) {
    if (Math.abs(item.y - currentY) <= yTolerance) {
      currentRow.push(item);
    } else {
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x);
        rows.push(currentRow);
      }
      currentRow = [item];
      currentY = item.y;
    }
  }

  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Main worker parsing function.
 */
export async function parsePdfBuffer(
  buffer: ArrayBuffer,
  onProgress?: (curr: number, total: number) => void
): Promise<OfferingRow[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  let totalTextItemsCount = 0;
  let establishedBounds: ColumnBound[] = [];
  const parsedRows: OfferingRow[] = [];
  let lastRow: OfferingRow | null = null;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: RawTextItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const tx = item.transform;
        items.push({
          str: item.str,
          x: tx[4],
          y: tx[5],
          width: item.width,
          height: item.height,
        });
      }
    }

    totalTextItemsCount += items.length;

    // Group items into visual lines
    const lineGroups = groupItemsIntoRows(items);

    for (let lineIndex = 0; lineIndex < lineGroups.length; lineIndex++) {
      const line = lineGroups[lineIndex];
      const lineText = line.map(i => i.str).join(' ').trim();

      // Check if this line is a table header row
      const isHeaderRow =
        /(course\s*code|course_code|course)/i.test(lineText) &&
        /(section|sec)/i.test(lineText) &&
        /(title|day|time|room)/i.test(lineText);

      if (isHeaderRow) {
        // Collect header items from this line AND any adjacent sub-header / super-header lines within +/- 14pt (e.g. Faculty at y:530, Initial at y:519)
        const currentY = line[0]?.y ?? 0;
        const headerItems: RawTextItem[] = [];
        let lastHeaderLineIdx = lineIndex;
        for (let gIdx = 0; gIdx < lineGroups.length; gIdx++) {
          const grp = lineGroups[gIdx];
          if (grp.length > 0 && Math.abs(grp[0].y - currentY) <= 14) {
            headerItems.push(...grp);
            if (gIdx > lastHeaderLineIdx) {
              lastHeaderLineIdx = gIdx;
            }
          }
        }

        const newBounds = deriveColumnBoundaries(headerItems, viewport.width);
        if (newBounds.length >= 6) {
          establishedBounds = newBounds;
        }
        lineIndex = lastHeaderLineIdx; // Skip past header band lines
        continue; // Skip outputting header row as a course
      }

      // If we don't have column bounds yet, we can't reliably assign cells
      if (establishedBounds.length === 0) {
        continue;
      }

      // Build cell values for this line
      const rowData: Record<string, string> = {
        sl: '',
        Program: '',
        'Course Code': '',
        Title: '',
        Section: '',
        Room1: '',
        Room2: '',
        Day1: '',
        Day2: '',
        Time1: '',
        Time2: '',
        'Faculty Name': '',
        'Faculty Initial': '',
        Credit: '',
      };

      for (const item of line) {
        const colKey = assignToColumn(item, establishedBounds);
        if (colKey) {
          rowData[colKey] = (rowData[colKey] ? rowData[colKey] + ' ' : '') + item.str.trim();
        }
      }

      let courseCode = rowData['Course Code'].trim();
      let section = rowData['Section'].trim();
      let title = rowData['Title'].trim();

      // Check if course code is valid: e.g. "ACT 2111", "CSE 1110", "MATH 1151", "CSE 4000A"
      const cleanCode = courseCode.replace(/[\s-]/g, '').toUpperCase();
      const isCourseCodeValid = /^[A-Z]{2,5}\d{3,4}[A-Z]?$/i.test(cleanCode) || /^[A-Z0-9]{3,9}$/i.test(cleanCode);

      // Decouple Title and Section if Title got merged into Section column
      if (section.length > 4 && /\s+[A-Za-z0-9]{1,4}(\s*\(.*?\))?$/.test(section)) {
        const match = section.match(/^(.*?)\s+([A-Za-z0-9]{1,4}(?:\s*\(.*?\))?)$/);
        if (match) {
          if (!title) {
            title = match[1].replace(/^(section|sec)\s+/i, '').trim();
          }
          section = match[2].trim();
        }
      }

      // If section is still long but Title is empty:
      if (!title && section.length > 5 && /\s+/.test(section)) {
        const words = section.split(/\s+/);
        section = words.pop() || section;
        title = words.join(' ');
      }

      // Clean section prefix if present
      section = section.replace(/^(section|sec)\s+/i, '').trim();

      // If Time2 is a single hyphen, treat as empty
      if (rowData.Time2 === '-' || rowData.Time2.trim() === '-') {
        rowData.Time2 = '';
      }
      if (rowData.Room2 === '-' || rowData.Room2.trim() === '-') {
        rowData.Room2 = '';
      }

      let facultyName = rowData['Faculty Name'].trim();
      let facultyInitial = rowData['Faculty Initial'].trim();

      // Normalize TBA cases
      if (/^tba$/i.test(facultyName) || /^t\.b\.a\.$/i.test(facultyName) || /^to be announced$/i.test(facultyName)) {
        facultyName = 'TBA';
      }
      if (/^tba$/i.test(facultyInitial) || /^t\.b\.a\.$/i.test(facultyInitial)) {
        facultyInitial = '';
      }

      // If facultyName is empty or TBA, but facultyInitial contains multi-word instructor name
      if ((!facultyName || facultyName === 'TBA') && facultyInitial && !/^tba$/i.test(facultyInitial)) {
        const parts = facultyInitial.split(/\s+/);
        if (parts.length > 1) {
          facultyInitial = parts.pop() || '';
          facultyName = parts.join(' ');
        } else if (facultyInitial.length > 5) {
          facultyName = facultyInitial;
          facultyInitial = '';
        }
      }

      // If facultyName and facultyInitial are identical, keep initial empty
      if (facultyName && facultyInitial && facultyName.toLowerCase() === facultyInitial.toLowerCase()) {
        facultyInitial = '';
      }

      // If facultyName contains "TBA", normalize to 'TBA'
      if (/tba/i.test(facultyName) && facultyName.length < 10) {
        facultyName = 'TBA';
        facultyInitial = '';
      }

      if (isCourseCodeValid && section) {
        const fullRow: OfferingRow = {
          sl: rowData.sl || String(parsedRows.length + 1),
          Program: rowData.Program,
          'Course Code': courseCode.toUpperCase(),
          Title: title,
          Section: section,
          Room1: rowData.Room1,
          Room2: rowData.Room2,
          Day1: rowData.Day1,
          Day2: rowData.Day2,
          Time1: rowData.Time1,
          Time2: rowData.Time2,
          'Faculty Name': facultyName,
          'Faculty Initial': facultyInitial,
          Credit: rowData.Credit || '3',
        };
        parsedRows.push(fullRow);
        lastRow = fullRow;
      } else if (lastRow && (title || facultyName)) {
        // Wrapped text continuation (e.g. multi-line Title or Faculty Name)
        if (title) {
          lastRow.Title = `${lastRow.Title} ${title}`.trim();
        }
        if (facultyName && facultyName !== 'TBA') {
          lastRow['Faculty Name'] = `${lastRow['Faculty Name']} ${facultyName}`.trim();
        }
      }
    }

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  // Handle scanned / empty PDF detection
  if (totalTextItemsCount < 20) {
    throw new Error(
      'This PDF appears to be a scanned image or has no selectable text layer. An OCR-processed PDF is required.'
    );
  }

  if (establishedBounds.length === 0 || parsedRows.length === 0) {
    throw new Error(
      'Could not detect standard schedule table headers in this document. Please ensure the offering PDF contains Course Code, Title, Section, Day, Time columns.'
    );
  }

  return parsedRows;
}

// Worker message listener if running inside Web Worker context
if (typeof self !== 'undefined' && 'postMessage' in self && typeof (self as any).window === 'undefined') {
  self.onmessage = async (e: MessageEvent) => {
    const { type, buffer } = e.data;
    if (type === 'PARSE_OFFERING') {
      try {
        const rows = await parsePdfBuffer(buffer, (curr, total) => {
          self.postMessage({
            type: 'PROGRESS',
            current: curr,
            total,
            percentage: Math.round((curr / total) * 100),
          });
        });
        self.postMessage({ type: 'SUCCESS', rows });
      } catch (err: any) {
        self.postMessage({ type: 'ERROR', error: err.message || 'Failed to parse PDF.' });
      }
    }
  };
}
