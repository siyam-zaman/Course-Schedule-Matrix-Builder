import { OfferingRow, ClassSession, ConflictPair, ConflictAnalysisResult, DayOfWeek } from '../types/schedule';
import { parseDays, parseTimeRange, doTimesOverlap, DAY_NAMES, formatMinutes } from './timeUtils';

/**
 * Extracts valid class sessions (Session 1 and Session 2) from an offering row.
 * Handles empty/blank Room2, Day2, Time2 safely.
 */
export function extractSessions(row: OfferingRow): ClassSession[] {
  const sessions: ClassSession[] = [];
  const courseCode = (row['Course Code'] || '').trim().toUpperCase();
  const section = (row['Section'] || '').trim();
  const title = (row['Title'] || '').trim();
  const facultyInitial = (row['Faculty Initial'] || '').trim();

  // Session 1: Day1, Time1, Room1
  const day1Raw = (row['Day1'] || '').trim();
  const time1Raw = (row['Time1'] || '').trim();
  const room1 = (row['Room1'] || '').trim();

  if (day1Raw && time1Raw) {
    const days1 = parseDays(day1Raw);
    const timeRange1 = parseTimeRange(time1Raw);
    if (days1.length > 0 && timeRange1) {
      sessions.push({
        courseCode,
        section,
        title,
        sessionNumber: 1,
        dayRaw: day1Raw,
        days: days1,
        timeRange: timeRange1,
        timeRaw: time1Raw,
        room: room1,
        facultyInitial,
      });
    }
  }

  // Session 2: Day2, Time2, Room2 (often empty)
  const day2Raw = (row['Day2'] || '').trim();
  const time2Raw = (row['Time2'] || '').trim();
  const room2 = (row['Room2'] || '').trim();

  if (day2Raw && time2Raw) {
    const days2 = parseDays(day2Raw);
    const timeRange2 = parseTimeRange(time2Raw);
    if (days2.length > 0 && timeRange2) {
      sessions.push({
        courseCode,
        section,
        title,
        sessionNumber: 2,
        dayRaw: day2Raw,
        days: days2,
        timeRange: timeRange2,
        timeRaw: time2Raw,
        room: room2,
        facultyInitial,
      });
    }
  }

  return sessions;
}

/**
 * Pure function to detect time conflicts among all selected courses.
 * Compares every session of each chosen course against every session of every other chosen course.
 */
export function detectConflicts(chosenRows: OfferingRow[]): ConflictAnalysisResult {
  const conflicts: ConflictPair[] = [];
  const conflictingCourseKeys = new Set<string>();
  const conflictingSessionKeys = new Set<string>();

  // Extract sessions for all chosen courses
  const courseSessionsMap: { row: OfferingRow; sessions: ClassSession[] }[] = chosenRows.map(row => ({
    row,
    sessions: extractSessions(row),
  }));

  // Compare each pair of distinct courses
  for (let i = 0; i < courseSessionsMap.length; i++) {
    for (let j = i + 1; j < courseSessionsMap.length; j++) {
      const entryA = courseSessionsMap[i];
      const entryB = courseSessionsMap[j];

      for (const sessionA of entryA.sessions) {
        for (const sessionB of entryB.sessions) {
          if (!sessionA.timeRange || !sessionB.timeRange) continue;

          // Check if any days intersect
          const matchingDays: DayOfWeek[] = sessionA.days.filter(day => sessionB.days.includes(day));

          if (matchingDays.length > 0) {
            // Check if times overlap
            if (doTimesOverlap(sessionA.timeRange, sessionB.timeRange)) {
              for (const day of matchingDays) {
                const overlapStart = Math.max(sessionA.timeRange.startMinutes, sessionB.timeRange.startMinutes);
                const overlapEnd = Math.min(sessionA.timeRange.endMinutes, sessionB.timeRange.endMinutes);
                const overlapDesc = `${formatMinutes(overlapStart)} – ${formatMinutes(overlapEnd)}`;

                const conflictPairId = `${sessionA.courseCode}-${sessionA.section}-S${sessionA.sessionNumber}__vs__${sessionB.courseCode}-${sessionB.section}-S${sessionB.sessionNumber}__${day}`;

                conflicts.push({
                  id: conflictPairId,
                  courseA: {
                    code: sessionA.courseCode,
                    section: sessionA.section,
                    title: sessionA.title,
                    sessionNumber: sessionA.sessionNumber,
                    day: sessionA.dayRaw,
                    time: sessionA.timeRaw,
                    room: sessionA.room,
                  },
                  courseB: {
                    code: sessionB.courseCode,
                    section: sessionB.section,
                    title: sessionB.title,
                    sessionNumber: sessionB.sessionNumber,
                    day: sessionB.dayRaw,
                    time: sessionB.timeRaw,
                    room: sessionB.room,
                  },
                  day,
                  dayName: DAY_NAMES[day],
                  overlapDescription: overlapDesc,
                });

                // Tag courses and specific sessions
                const courseKeyA = `${sessionA.courseCode}__${sessionA.section}`;
                const courseKeyB = `${sessionB.courseCode}__${sessionB.section}`;
                conflictingCourseKeys.add(courseKeyA);
                conflictingCourseKeys.add(courseKeyB);

                const sessionKeyA = `${sessionA.courseCode}__${sessionA.section}__S${sessionA.sessionNumber}`;
                const sessionKeyB = `${sessionB.courseCode}__${sessionB.section}__S${sessionB.sessionNumber}`;
                conflictingSessionKeys.add(sessionKeyA);
                conflictingSessionKeys.add(sessionKeyB);
              }
            }
          }
        }
      }
    }
  }

  return {
    conflicts,
    conflictingCourseKeys,
    conflictingSessionKeys,
  };
}
