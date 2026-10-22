export interface OfferingRow {
  sl: string;
  Program: string;
  'Course Code': string;
  Title: string;
  Section: string;
  Room1: string;
  Room2: string;
  Day1: string;
  Day2: string;
  Time1: string;
  Time2: string;
  'Faculty Name': string;
  'Faculty Initial': string;
  Credit: string;
  [key: string]: string;
}

export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface TimeRange {
  startMinutes: number; // minutes from 00:00
  endMinutes: number;   // minutes from 00:00
  raw: string;
}

export interface ClassSession {
  courseCode: string;
  section: string;
  title: string;
  sessionNumber: 1 | 2;
  dayRaw: string;
  days: DayOfWeek[];
  timeRange: TimeRange | null;
  timeRaw: string;
  room: string;
  facultyInitial: string;
}

export interface ConflictPair {
  id: string;
  courseA: {
    code: string;
    section: string;
    title: string;
    sessionNumber: 1 | 2;
    day: string;
    time: string;
    room: string;
  };
  courseB: {
    code: string;
    section: string;
    title: string;
    sessionNumber: 1 | 2;
    day: string;
    time: string;
    room: string;
  };
  day: DayOfWeek;
  dayName: string;
  overlapDescription: string;
}

export interface ConflictAnalysisResult {
  conflicts: ConflictPair[];
  conflictingCourseKeys: Set<string>; // "CODE__SECTION"
  conflictingSessionKeys: Set<string>; // "CODE__SECTION__S1" or "CODE__SECTION__S2"
}

export interface ParseProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  status: string;
}
