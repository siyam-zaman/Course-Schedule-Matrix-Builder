import React from 'react';
import { ConflictPair } from '../types/schedule';
import { AlertTriangle, CheckCircle2, Calendar, Clock, ArrowRightLeft } from 'lucide-react';

interface ConflictSummaryProps {
  conflicts: ConflictPair[];
  selectedCount: number;
}

export const ConflictSummary: React.FC<ConflictSummaryProps> = ({ conflicts, selectedCount }) => {
  if (selectedCount === 0) {
    return null;
  }

  const hasConflicts = conflicts.length > 0;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Schedule conflict summary"
      className="w-full"
    >
      {!hasConflicts ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              No Time Conflicts Found!
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              All {selectedCount} chosen courses have completely non-overlapping schedules. You're ready to enroll!
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                  <span>{conflicts.length} Schedule Conflict{conflicts.length > 1 ? 's' : ''} Detected</span>
                  <span className="px-2 py-0.5 text-xs font-extrabold bg-rose-600 text-white rounded-full">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-rose-700">
                  The courses below have overlapping class meeting times on the same day. Please choose an alternate section.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-white/90 border border-rose-300 rounded-xl p-3.5 shadow-2xs space-y-2 text-xs"
              >
                {/* Conflict pair header */}
                <div className="flex items-center justify-between font-bold text-rose-950 pb-2 border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono">
                      {conflict.courseA.code} (Sec {conflict.courseA.section})
                    </span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-rose-500" />
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono">
                      {conflict.courseB.code} (Sec {conflict.courseB.section})
                    </span>
                  </div>
                </div>

                {/* Overlap details */}
                <div className="space-y-1 text-slate-700">
                  <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>Day: {conflict.dayName} ({conflict.day})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-800">
                    <Clock className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>
                      Overlapping Time Window:{' '}
                      <strong className="underline decoration-rose-400">{conflict.overlapDescription}</strong>
                    </span>
                  </div>
                </div>

                {/* Individual class times */}
                <div className="pt-2 border-t border-rose-100 text-[11px] text-slate-500 flex flex-col gap-1 font-mono">
                  <div>
                    • {conflict.courseA.code}: {conflict.courseA.time}{' '}
                    {conflict.courseA.room && `[Room ${conflict.courseA.room}]`}
                  </div>
                  <div>
                    • {conflict.courseB.code}: {conflict.courseB.time}{' '}
                    {conflict.courseB.room && `[Room ${conflict.courseB.room}]`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
