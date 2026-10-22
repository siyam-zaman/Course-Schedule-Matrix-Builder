import { describe, it, expect } from 'vitest';
import { parseDays, parseTimeRange, doTimesOverlap, formatMinutes } from './timeUtils';

describe('timeUtils - Day Normalization', () => {
  it('parses single standard days correctly', () => {
    expect(parseDays('Sunday')).toEqual(['SUN']);
    expect(parseDays('Sun')).toEqual(['SUN']);
    expect(parseDays('S')).toEqual(['SUN']);
    expect(parseDays('Monday')).toEqual(['MON']);
    expect(parseDays('Mon')).toEqual(['MON']);
    expect(parseDays('M')).toEqual(['MON']);
    expect(parseDays('Tuesday')).toEqual(['TUE']);
    expect(parseDays('Tue')).toEqual(['TUE']);
    expect(parseDays('T')).toEqual(['TUE']);
    expect(parseDays('Wednesday')).toEqual(['WED']);
    expect(parseDays('Wed')).toEqual(['WED']);
    expect(parseDays('W')).toEqual(['WED']);
    expect(parseDays('Thursday')).toEqual(['THU']);
    expect(parseDays('Thu')).toEqual(['THU']);
    expect(parseDays('R')).toEqual(['THU']);
    expect(parseDays('Friday')).toEqual(['FRI']);
    expect(parseDays('Fri')).toEqual(['FRI']);
    expect(parseDays('F')).toEqual(['FRI']);
    expect(parseDays('Saturday')).toEqual(['SAT']);
    expect(parseDays('Sat')).toEqual(['SAT']);
  });

  it('parses combined day codes (ST, MW, TR, RA, WS, MWF)', () => {
    expect(parseDays('ST')).toEqual(['SUN', 'TUE']);
    expect(parseDays('MW')).toEqual(['MON', 'WED']);
    expect(parseDays('TR')).toEqual(['TUE', 'THU']);
    expect(parseDays('RA')).toEqual(['THU', 'SUN']);
    expect(parseDays('WS')).toEqual(['WED', 'SAT']);
    expect(parseDays('MWF')).toEqual(['MON', 'WED', 'FRI']);
  });

  it('parses delimited day strings like Sun/Tue, Sun, Tue, and S/T', () => {
    expect(parseDays('Sun/Tue')).toEqual(expect.arrayContaining(['SUN', 'TUE']));
    expect(parseDays('Sun, Tue')).toEqual(expect.arrayContaining(['SUN', 'TUE']));
    expect(parseDays('S/T')).toEqual(expect.arrayContaining(['SUN', 'TUE']));
    expect(parseDays('Mon - Wed')).toEqual(expect.arrayContaining(['MON', 'WED']));
  });

  it('handles empty or whitespace strings safely', () => {
    expect(parseDays('')).toEqual([]);
    expect(parseDays(null)).toEqual([]);
    expect(parseDays('   ')).toEqual([]);
  });
});

describe('timeUtils - Time Range Parsing', () => {
  it('parses standard 12-hour AM/PM ranges', () => {
    const range = parseTimeRange('08:30 AM - 10:00 AM');
    expect(range).not.toBeNull();
    expect(range?.startMinutes).toBe(8 * 60 + 30); // 510
    expect(range?.endMinutes).toBe(10 * 60);       // 600
  });

  it('parses afternoon times and single suffix e.g. 1:30 PM - 3:00 PM and 1:30-3:00 PM', () => {
    const range1 = parseTimeRange('1:30 PM - 3:00 PM');
    expect(range1?.startMinutes).toBe(13 * 60 + 30); // 810
    expect(range1?.endMinutes).toBe(15 * 60);        // 900

    const range2 = parseTimeRange('01:30 - 03:00 PM');
    expect(range2?.startMinutes).toBe(13 * 60 + 30);
    expect(range2?.endMinutes).toBe(15 * 60);
  });

  it('parses ranges spanning morning to afternoon (e.g. 11:30 AM - 01:00 PM)', () => {
    const range = parseTimeRange('11:30 AM - 01:00 PM');
    expect(range?.startMinutes).toBe(11 * 60 + 30); // 690
    expect(range?.endMinutes).toBe(13 * 60);        // 780
  });

  it('parses times without AM/PM using university heuristics', () => {
    const range = parseTimeRange('08:30 - 10:00');
    expect(range?.startMinutes).toBe(510);
    expect(range?.endMinutes).toBe(600);
  });

  it('returns null for invalid strings', () => {
    expect(parseTimeRange('')).toBeNull();
    expect(parseTimeRange('invalid')).toBeNull();
    expect(parseTimeRange(null)).toBeNull();
  });
});

describe('timeUtils - Overlap Logic', () => {
  it('returns true when time ranges overlap', () => {
    const a = { startMinutes: 510, endMinutes: 600, raw: '08:30 - 10:00' };
    const b = { startMinutes: 540, endMinutes: 630, raw: '09:00 - 10:30' };
    expect(doTimesOverlap(a, b)).toBe(true);
  });

  it('returns false for touching boundaries (end == start)', () => {
    // 08:30 - 10:00 and 10:00 - 11:30
    const a = { startMinutes: 510, endMinutes: 600, raw: '08:30 - 10:00' };
    const b = { startMinutes: 600, endMinutes: 690, raw: '10:00 - 11:30' };
    expect(doTimesOverlap(a, b)).toBe(false);
    expect(doTimesOverlap(b, a)).toBe(false);
  });

  it('returns false when ranges are completely separated', () => {
    const a = { startMinutes: 510, endMinutes: 600, raw: '08:30 - 10:00' };
    const b = { startMinutes: 720, endMinutes: 810, raw: '12:00 - 01:30' };
    expect(doTimesOverlap(a, b)).toBe(false);
  });
});
