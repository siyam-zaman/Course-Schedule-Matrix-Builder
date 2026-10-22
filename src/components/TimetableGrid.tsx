import React from 'react';
import { OfferingRow, DayOfWeek } from '../types/schedule';
import { extractSessions } from '../utils/conflictDetector';
import { DAY_NAMES, ORDERED_DAYS, formatMinutes } from '../utils/timeUtils';
import { AlertCircle, Clock, MapPin, User } from 'lucide-react';

interface TimetableGridProps {
  chosenRows: OfferingRow[];
  conflictingSessionKeys: Set<string>;
  conflictingCourseKeys: Set<string>;
}

const START_HOUR = 8; // 08:00 AM
const END_HOUR = 19;  // 07:00 PM
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 660 minutes
const PIXELS_PER_MINUTE = 1.35; // height scaling
const HEADER_HEIGHT = 44;

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  chosenRows,
  conflictingSessionKeys,
  conflictingCourseKeys,
}) => {
  if (chosenRows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        <p className="text-sm font-medium text-slate-700">No Courses to Display on Grid</p>
        <p className="text-xs text-slate-400 mt-1">
          Pick your course sections to visualize your weekly schedule.
        </p>
      </div>
    );
  }

  // Extract all sessions for the chosen rows
  const allSessionsWithRow = chosenRows.flatMap((row) => {
    const sessions = extractSessions(row);
    return sessions.map((session) => ({
      session,
      row,
    }));
  });

  // Check which days have active classes
  const activeDaysSet = new Set<DayOfWeek>();
  for (const item of allSessionsWithRow) {
    item.session.days.forEach((d) => activeDaysSet.add(d));
  }

  // Use days present, or default to Sunday-Thursday if sparse, or full week
  const displayDays = ORDERED_DAYS.filter(
    (d) => activeDaysSet.has(d) || ['SUN', 'MON', 'TUE', 'WED', 'THU'].includes(d)
  );

  // Generate hourly markers
  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Weekly Timetable Visualizer</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Live Grid
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Interactive weekly view highlighting schedule blocks and overlapping time slots
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
            <span className="text-slate-600">Conflict-Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-200 border-2 border-red-500" />
            <span className="text-red-700 font-bold">Conflicting</span>
          </div>
        </div>
      </div>

      {/* Timetable visual container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible">
        <div
          className="min-w-[760px] grid"
          style={{
            gridTemplateColumns: `70px repeat(${displayDays.length}, minmax(130px, 1fr))`,
          }}
        >
          {/* Header Top-Left Empty Corner */}
          <div className="h-11 border-b border-r border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] font-bold text-slate-400">
            TIME
          </div>

          {/* Day Column Headers */}
          {displayDays.map((day) => (
            <div
              key={day}
              className="h-11 border-b border-r border-slate-200 bg-slate-50 flex flex-col items-center justify-center font-bold text-slate-800 text-xs last:border-r-0"
            >
              <span>{DAY_NAMES[day]}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">{day}</span>
            </div>
          ))}

          {/* Time Gutter (Left column) */}
          <div
            className="relative border-r border-slate-200 bg-slate-50/50"
            style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}
          >
            {hours.map((h) => {
              const topPx = (h - START_HOUR) * 60 * PIXELS_PER_MINUTE;
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-200/80 pr-2 text-right text-[10px] font-mono text-slate-400 select-none"
                  style={{ top: `${topPx}px` }}
                >
                  <span className="-top-2 relative bg-slate-50 px-0.5">
                    {formatMinutes(h * 60)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day Columns with Events */}
          {displayDays.map((day) => {
            return (
              <div
                key={day}
                className="relative border-r border-slate-200 last:border-r-0 bg-white"
                style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}
              >
                {/* Horizontal background guideline grids */}
                {hours.map((h) => {
                  const topPx = (h - START_HOUR) * 60 * PIXELS_PER_MINUTE;
                  return (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                      style={{ top: `${topPx}px` }}
                    />
                  );
                })}

                {/* Event blocks for this day */}
                {allSessionsWithRow.map(({ session, row }, idx) => {
                  if (!session.days.includes(day) || !session.timeRange) {
                    return null;
                  }

                  const startMin = session.timeRange.startMinutes;
                  const endMin = session.timeRange.endMinutes;

                  // Constrain to display window
                  const clampedStart = Math.max(startMin, START_HOUR * 60);
                  const clampedEnd = Math.min(endMin, END_HOUR * 60);
                  const topPx = (clampedStart - START_HOUR * 60) * PIXELS_PER_MINUTE;
                  const heightPx = Math.max(
                    (clampedEnd - clampedStart) * PIXELS_PER_MINUTE,
                    34
                  );

                  const courseKey = `${session.courseCode}__${session.section}`;
                  const sessionKey = `${courseKey}__S${session.sessionNumber}`;
                  const isConflicting =
                    conflictingSessionKeys.has(sessionKey) ||
                    conflictingCourseKeys.has(courseKey);

                  return (
                    <div
                      key={`${session.courseCode}-${session.section}-${session.sessionNumber}-${day}-${idx}`}
                      className={`absolute left-1.5 right-1.5 rounded-lg p-2 text-xs transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                        isConflicting
                          ? 'bg-red-100 border-2 border-red-500 text-red-950 font-semibold shadow-sm z-10 ring-1 ring-red-400'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-950 hover:bg-indigo-100/90 z-0'
                      }`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                      }}
                      title={`${session.courseCode} Sec ${session.section}: ${session.timeRaw}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <span className="font-bold font-mono tracking-tight text-[12px]">
                            {session.courseCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              isConflicting
                                ? 'bg-red-600 text-white font-bold'
                                : 'bg-indigo-200/70 text-indigo-900 font-semibold'
                            }`}
                          >
                            Sec {session.section}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-600 truncate mt-0.5" title={session.title}>
                          {session.title}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/5 mt-1">
                        <div className="flex items-center gap-0.5 truncate text-slate-600">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>{session.room || 'TBA'}</span>
                        </div>

                        {isConflicting ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-red-700 bg-red-200 px-1 rounded">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>CONFLICT</span>
                          </span>
                        ) : (
                          session.facultyInitial && (
                            <span className="font-mono text-slate-500">
                              {session.facultyInitial}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
