import { OfferingRow } from '../types/schedule';

export const CSV_COLUMNS: (keyof OfferingRow)[] = [
  'sl',
  'Program',
  'Course Code',
  'Title',
  'Section',
  'Room1',
  'Room2',
  'Day1',
  'Day2',
  'Time1',
  'Time2',
  'Faculty Name',
  'Faculty Initial',
  'Credit',
];

/**
 * Escapes a cell value for standard RFC 4180 CSV.
 */
function escapeCsvCell(value: string | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV string from offering rows.
 */
export function generateCsv(rows: OfferingRow[]): string {
  const headerLine = CSV_COLUMNS.map(col => `"${col}"`).join(',');
  const rowLines = rows.map(row => {
    return CSV_COLUMNS.map(col => escapeCsvCell(row[col])).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a browser download of the schedule CSV file.
 */
export function downloadCsv(rows: OfferingRow[], filename = 'course_schedule_matrix.csv'): void {
  const csvContent = generateCsv(rows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
