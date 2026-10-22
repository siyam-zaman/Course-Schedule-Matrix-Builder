import { DayOfWeek, TimeRange } from '../types/schedule';

export const DAY_NAMES: Record<DayOfWeek, string> = {
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export const ORDERED_DAYS: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Normalizes and decomposes raw day string into array of standard DayOfWeek codes.
 * Supports single days, abbreviations, combined strings ("ST", "MW", "TR", "MWF", "RA"),
 * and delimited formats ("Sun/Tue", "Sun, Tue", "Sun - Tue").
 */
export function parseDays(rawDay: string | null | undefined): DayOfWeek[] {
  if (!rawDay) return [];
  const trimmed = rawDay.trim().toUpperCase();
  if (!trimmed) return [];

  // Check known multi-day tokens first
  switch (trimmed) {
    case 'ST':
      return ['SUN', 'TUE'];
    case 'MW':
      return ['MON', 'WED'];
    case 'TR':
      return ['TUE', 'THU'];
    case 'SR':
      return ['SUN', 'THU'];
    case 'RA':
      return ['THU', 'SUN'];
    case 'WS':
      return ['WED', 'SAT'];
    case 'MWF':
      return ['MON', 'WED', 'FRI'];
    case 'MTWRF':
      return ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  }

  // Check if string contains delimiters like ',', '/', '-', '&', 'AND', or spaces
  if (/[,/\-&]|AND|\s+/.test(trimmed)) {
    const parts = trimmed.split(/[,/\-&]|\s+AND\s+|\s+/).filter(Boolean);
    const daySet = new Set<DayOfWeek>();
    for (const part of parts) {
      const parsed = parseDays(part);
      parsed.forEach(d => daySet.add(d));
    }
    return Array.from(daySet);
  }

  // Single day mapping
  if (/^(SUN|SUNDAY|S)$/.test(trimmed)) return ['SUN'];
  if (/^(MON|MONDAY|M)$/.test(trimmed)) return ['MON'];
  if (/^(TUE|TUES|TUESDAY|T)$/.test(trimmed)) return ['TUE'];
  if (/^(WED|WEDNESDAY|W)$/.test(trimmed)) return ['WED'];
  if (/^(THU|THUR|THURS|THURSDAY|TH|R)$/.test(trimmed)) return ['THU'];
  if (/^(FRI|FRIDAY|F)$/.test(trimmed)) return ['FRI'];
  if (/^(SAT|SATURDAY|SA)$/.test(trimmed)) return ['SAT'];

  return [];
}

/**
 * Parses an individual time token (e.g. "08:30 AM", "10:00", "1:30 PM", "8:30")
 * into hours (0-23) and minutes (0-59). If meridiem is missing, contextMeridiem is used,
 * or it falls back to university class heuristics.
 */
export function parseIndividualTime(
  token: string,
  contextMeridiem?: 'AM' | 'PM' | null
): { hours: number; minutes: number } | null {
  // Normalize colons before AM/PM (e.g. "08:30:AM" -> "08:30 AM")
  const clean = token.trim().toUpperCase().replace(/:([AP]M)/gi, ' $1');
  if (!clean) return null;

  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3] ? (match[3].toUpperCase() as 'AM' | 'PM') : contextMeridiem;

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  } else if (!meridiem) {
    // Heuristic for academic timetables when AM/PM is omitted:
    // 8..11 are AM; 12 is 12 PM; 1..7 are PM (13..19)
    if (hours >= 1 && hours <= 7) {
      hours += 12;
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Parses a time range string such as "08:30 AM - 10:00 AM", "8:30-10:00 AM", "1:30 - 3:00 PM"
 * into minutes from midnight (0..1439).
 */
export function parseTimeRange(rawTime: string | null | undefined): TimeRange | null {
  if (!rawTime) return null;
  const trimmed = rawTime.trim();
  if (!trimmed) return null;

  // Split on hyphen, "to", or " - "
  const parts = trimmed.split(/\s*(?:-|–|—|\bTO\b)\s*/i);
  if (parts.length !== 2) return null;

  const startPart = parts[0].trim();
  const endPart = parts[1].trim();

  // Check if end part has AM/PM
  const endMeridiemMatch = endPart.match(/(AM|PM)$/i);
  const endMeridiem = endMeridiemMatch ? (endMeridiemMatch[1].toUpperCase() as 'AM' | 'PM') : null;

  // Check if start part has AM/PM
  const startMeridiemMatch = startPart.match(/(AM|PM)$/i);
  const startMeridiem = startMeridiemMatch ? (startMeridiemMatch[1].toUpperCase() as 'AM' | 'PM') : null;

  // End time parsing
  const parsedEnd = parseIndividualTime(endPart, null);
  if (!parsedEnd) return null;

  // Start time parsing: if start has no AM/PM, but end has AM/PM,
  // we check if start was in the same period or AM (e.g., 11:30 - 01:00 PM -> start is AM, end is PM;
  // 08:30 - 10:00 AM -> start is AM, end is AM)
  let inferredStartMeridiem: 'AM' | 'PM' | null = startMeridiem;
  if (!inferredStartMeridiem && endMeridiem) {
    const rawStartHour = parseInt(startPart.match(/^(\d{1,2})/)?.[1] || '0', 10);
    if (endMeridiem === 'PM') {
      // e.g. 11:30 - 1:00 PM: 11 is AM
      // e.g. 2:00 - 3:30 PM: 2 is PM
      if (rawStartHour >= 8 && rawStartHour <= 11) {
        inferredStartMeridiem = 'AM';
      } else {
        inferredStartMeridiem = 'PM';
      }
    } else {
      inferredStartMeridiem = 'AM';
    }
  }

  const parsedStart = parseIndividualTime(startPart, inferredStartMeridiem);
  if (!parsedStart) return null;

  const startMinutes = parsedStart.hours * 60 + parsedStart.minutes;
  let endMinutes = parsedEnd.hours * 60 + parsedEnd.minutes;

  // If end is numerically less than start and end was parsed without explicit AM/PM,
  // it might span across 12 PM (e.g. 11:30 - 1:00)
  if (endMinutes < startMinutes && endMinutes < 12 * 60) {
    endMinutes += 12 * 60;
  }

  return {
    startMinutes,
    endMinutes,
    raw: trimmed,
  };
}

/**
 * Checks if two time ranges overlap.
 * Overlap condition: startA < endB AND startB < endA
 * Touching boundaries (end == start) are NOT a conflict.
 */
export function doTimesOverlap(rangeA: TimeRange, rangeB: TimeRange): boolean {
  return rangeA.startMinutes < rangeB.endMinutes && rangeB.startMinutes < rangeA.endMinutes;
}

/**
 * Formats minutes from midnight to readable string (e.g. 510 -> "08:30 AM")
 */
export function formatMinutes(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = m.toString().padStart(2, '0');
  const hh = h12.toString().padStart(2, '0');
  return `${hh}:${mm} ${meridiem}`;
}
