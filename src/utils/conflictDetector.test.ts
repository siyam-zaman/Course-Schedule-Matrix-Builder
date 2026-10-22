import { describe, it, expect } from 'vitest';
import { detectConflicts, extractSessions } from './conflictDetector';
import { OfferingRow } from '../types/schedule';

function createRow(overrides: Partial<OfferingRow>): OfferingRow {
  return {
    sl: '1',
    Program: 'BSCSE',
    'Course Code': 'CSE115',
    Title: 'Programming Language I',
    Section: '1',
    Room1: 'SAC301',
    Room2: '',
    Day1: 'ST',
    Day2: '',
    Time1: '08:30 AM - 10:00 AM',
    Time2: '',
    'Faculty Name': 'Dr. Alan Turing',
    'Faculty Initial': 'ALT',
    Credit: '3',
    ...overrides,
  };
}

describe('conflictDetector - Pure Function Requirements', () => {
  it('1. Same day / overlapping time -> CONFLICT', () => {
    // Course A: Sunday 08:30 AM - 10:00 AM
    // Course B: Sunday 09:30 AM - 11:00 AM
    const courseA = createRow({
      'Course Code': 'CSE115',
      Section: '1',
      Day1: 'Sunday',
      Time1: '08:30 AM - 10:00 AM',
    });
    const courseB = createRow({
      'Course Code': 'MAT120',
      Section: '2',
      Day1: 'Sunday',
      Time1: '09:30 AM - 11:00 AM',
    });

    const result = detectConflicts([courseA, courseB]);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].day).toBe('SUN');
    expect(result.conflictingCourseKeys.has('CSE115__1')).toBe(true);
    expect(result.conflictingCourseKeys.has('MAT120__2')).toBe(true);
  });

  it('2. Same day / touching times (end == start) -> NO CONFLICT', () => {
    // Course A: Sunday 08:30 AM - 10:00 AM
    // Course B: Sunday 10:00 AM - 11:30 AM
    const courseA = createRow({
      'Course Code': 'CSE115',
      Section: '1',
      Day1: 'Sunday',
      Time1: '08:30 AM - 10:00 AM',
    });
    const courseB = createRow({
      'Course Code': 'MAT120',
      Section: '2',
      Day1: 'Sunday',
      Time1: '10:00 AM - 11:30 AM',
    });

    const result = detectConflicts([courseA, courseB]);
    expect(result.conflicts.length).toBe(0);
    expect(result.conflictingCourseKeys.size).toBe(0);
  });

  it('3. Different day / same time -> NO CONFLICT', () => {
    // Course A: Sunday 08:30 AM - 10:00 AM
    // Course B: Monday 08:30 AM - 10:00 AM
    const courseA = createRow({
      'Course Code': 'CSE115',
      Section: '1',
      Day1: 'Sunday',
      Time1: '08:30 AM - 10:00 AM',
    });
    const courseB = createRow({
      'Course Code': 'MAT120',
      Section: '2',
      Day1: 'Monday',
      Time1: '08:30 AM - 10:00 AM',
    });

    const result = detectConflicts([courseA, courseB]);
    expect(result.conflicts.length).toBe(0);
  });

  it('4. Blank Day2 / Time2 -> Handled safely without error', () => {
    // Course A has blank Day2/Time2
    // Course B has both Session 1 and Session 2
    const courseA = createRow({
      'Course Code': 'CSE115',
      Section: '1',
      Day1: 'Mon',
      Time1: '08:30 AM - 10:00 AM',
      Day2: '',
      Time2: '',
      Room2: '',
    });
    const courseB = createRow({
      'Course Code': 'PHY107',
      Section: '1',
      Day1: 'Wed',
      Time1: '08:30 AM - 10:00 AM',
      Day2: 'Mon',
      Time2: '09:00 AM - 10:30 AM',
      Room2: 'SAC202',
    });

    // Session 1 of Course A and Session 2 of Course B are both on Monday and overlap
    const result = detectConflicts([courseA, courseB]);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].day).toBe('MON');
    expect(result.conflicts[0].courseA.sessionNumber).toBe(1);
    expect(result.conflicts[0].courseB.sessionNumber).toBe(2);
    expect(result.conflictingSessionKeys.has('CSE115__1__S1')).toBe(true);
    expect(result.conflictingSessionKeys.has('PHY107__1__S2')).toBe(true);
  });

  it('5. Combined day codes (ST, MW, TR) -> Accurately detected', () => {
    // Course A: "ST" (Sunday & Tuesday) 10:00 AM - 11:30 AM
    // Course B: "Tuesday" 11:00 AM - 12:30 PM
    const courseA = createRow({
      'Course Code': 'CSE215',
      Section: '3',
      Day1: 'ST',
      Time1: '10:00 AM - 11:30 AM',
    });
    const courseB = createRow({
      'Course Code': 'ENG102',
      Section: '1',
      Day1: 'Tue',
      Time1: '11:00 AM - 12:30 PM',
    });

    const result = detectConflicts([courseA, courseB]);
    // They conflict on Tuesday!
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].day).toBe('TUE');
    expect(result.conflicts[0].dayName).toBe('Tuesday');
    expect(result.conflictingCourseKeys.has('CSE215__3')).toBe(true);
    expect(result.conflictingCourseKeys.has('ENG102__1')).toBe(true);
  });

  it('handles multi-session combined day overlaps correctly', () => {
    // Course A: "MW" 01:30 PM - 03:00 PM
    // Course B: "MW" 02:00 PM - 03:30 PM
    // Conflicts on BOTH Monday and Wednesday!
    const courseA = createRow({
      'Course Code': 'CSE311',
      Section: '1',
      Day1: 'MW',
      Time1: '01:30 PM - 03:00 PM',
    });
    const courseB = createRow({
      'Course Code': 'CSE327',
      Section: '2',
      Day1: 'MW',
      Time1: '02:00 PM - 03:30 PM',
    });

    const result = detectConflicts([courseA, courseB]);
    expect(result.conflicts.length).toBe(2);
    const days = result.conflicts.map(c => c.day);
    expect(days).toContain('MON');
    expect(days).toContain('WED');
  });
});
