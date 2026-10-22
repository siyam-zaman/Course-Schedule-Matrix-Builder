import * as pdfjsLib from 'pdfjs-dist';

/**
 * Normalizes course codes for robust comparison (e.g. "cse 115" -> "CSE115", "MAT-120" -> "MAT120")
 */
export function normalizeCodeKey(code: string): string {
  return (code || '').toUpperCase().replace(/[\s\-_]/g, '');
}

/**
 * Parses manual text input (comma, semicolon, space, or newline separated)
 * and returns a list of unique normalized course codes.
 */
export function parseManualCourseInput(text: string): string[] {
  if (!text) return [];

  // Split on commas, semicolons, or newlines
  // Also handle spaces between distinct course codes like "CSE115 MAT120 PHY107"
  const tokens = text
    .split(/[,;\n\r\t]+/)
    .flatMap(item => item.trim().split(/\s{2,}|\s(?=[A-Za-z]{2,4}\s*\d)/))
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0);

  return Array.from(new Set(tokens));
}

/**
 * Extracts course codes from a second PDF (e.g. Advising Slip, Degree Plan, Registration Slip).
 * Matches against known offering codes, or regex patterns for academic course codes.
 */
export async function extractCoursesFromPdf(
  file: File,
  knownOfferingCodes: string[]
): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += ' ' + pageText;
  }

  const foundSet = new Set<string>();
  const normalizedKnownMap = new Map<string, string>();
  for (const code of knownOfferingCodes) {
    normalizedKnownMap.set(normalizeCodeKey(code), code);
  }

  // 1. Direct match for known offering course codes
  for (const [normKey, originalCode] of normalizedKnownMap.entries()) {
    // Regex that looks for the code with optional whitespace (e.g., CSE 115 or CSE115)
    const regexPattern = new RegExp(`\\b${normKey.slice(0, 3)}\\s*${normKey.slice(3)}\\b`, 'i');
    if (regexPattern.test(fullText)) {
      foundSet.add(originalCode);
    }
  }

  // 2. Generic regex search for university course patterns (e.g. CSE115, MAT 120, ENG102, BIO103L)
  const genericCourseRegex = /\b([A-Z]{2,5})\s*(\d{3}[A-Z]?)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = genericCourseRegex.exec(fullText)) !== null) {
    const candidate = `${match[1]}${match[2]}`.toUpperCase();
    const candidateKey = normalizeCodeKey(candidate);
    if (normalizedKnownMap.has(candidateKey)) {
      foundSet.add(normalizedKnownMap.get(candidateKey)!);
    } else {
      foundSet.add(candidate);
    }
  }

  return Array.from(foundSet);
}

export interface MergedCourseSelection {
  allRequestedCodes: string[];
  matchedCodes: string[];
  unmatchedCodes: string[];
}

/**
 * Merges course codes from PDF and manual input, deduplicates,
 * and identifies which ones exist in the offering data.
 */
export function processCourseSelection(
  pdfCodes: string[],
  manualText: string,
  availableOfferingCodes: string[]
): MergedCourseSelection {
  const manualCodes = parseManualCourseInput(manualText);
  const combined = Array.from(new Set([...pdfCodes, ...manualCodes]));

  // Build map of normalized available codes -> canonical offering code
  const offeringMap = new Map<string, string>();
  for (const code of availableOfferingCodes) {
    offeringMap.set(normalizeCodeKey(code), code);
  }

  const matchedSet = new Set<string>();
  const unmatchedSet = new Set<string>();

  for (const rawCode of combined) {
    const key = normalizeCodeKey(rawCode);
    if (offeringMap.has(key)) {
      matchedSet.add(offeringMap.get(key)!);
    } else {
      unmatchedSet.add(rawCode.trim().toUpperCase());
    }
  }

  return {
    allRequestedCodes: combined,
    matchedCodes: Array.from(matchedSet),
    unmatchedCodes: Array.from(unmatchedSet),
  };
}
