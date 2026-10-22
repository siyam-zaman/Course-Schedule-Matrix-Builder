import React from 'react';
import { OfferingRow } from '../types/schedule';
import { Check, Clock, User, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { formatFaculty } from '../utils/formatFaculty';

interface SectionPickerProps {
  matchedCodes: string[];
  allOfferingRows: OfferingRow[];
  selectedSections: Record<string, string>; // courseCode -> sectionNumber
  conflictingSessionKeys: Set<string>;
  conflictingCourseKeys: Set<string>;
  onSelectSection: (courseCode: string, section: string) => void;
  onAutoSelectAll: () => void;
  onRemoveCourse: (courseCode: string) => void;
}

/**
 * Normalizes and extracts the short section token (e.g. "A", "B", "1", "01")
 * even if the offering PDF merged title or words into it.
 */
function getDisplaySection(rawSec: string): string {
  if (!rawSec) return '1';
  let s = rawSec.trim().replace(/^(section|sec)\s+/i, '').trim();
  if (s.length > 5 && /\s+([A-Za-z0-9]{1,4})$/.test(s)) {
    const match = s.match(/\s+([A-Za-z0-9]{1,4})$/);
    if (match) return match[1];
  }
  return s.length > 8 ? s.slice(0, 8) + '…' : s;
}

/**
 * Extracts best available course title from rows
 */
function getDisplayTitle(rows: OfferingRow[]): string {
  for (const r of rows) {
    if (r.Title && r.Title.trim()) {
      return r.Title.trim();
    }
    // If title was absorbed into section
    if (r.Section && r.Section.length > 5 && /\s+[A-Za-z0-9]{1,4}$/.test(r.Section)) {
      const match = r.Section.match(/^(.*?)\s+([A-Za-z0-9]{1,4})$/);
      if (match && match[1].trim()) {
        return match[1].replace(/^(section|sec)\s+/i, '').trim();
      }
    }
  }
  return '';
}

export const SectionPicker: React.FC<SectionPickerProps> = ({
  matchedCodes,
  allOfferingRows,
  selectedSections,
  conflictingSessionKeys,
  conflictingCourseKeys,
  onSelectSection,
  onAutoSelectAll,
  onRemoveCourse,
}) => {
  if (matchedCodes.length === 0) {
    return null;
  }

  // Group offering rows by Course Code
  const sectionsByCourse = new Map<string, OfferingRow[]>();
  for (const code of matchedCodes) {
    const matching = allOfferingRows.filter(
      r => (r['Course Code'] || '').trim().toUpperCase() === code.toUpperCase()
    );
    // Sort sections numerically or alphabetically
    matching.sort((a, b) => {
      const secA = parseInt(a.Section, 10);
      const secB = parseInt(b.Section, 10);
      if (!isNaN(secA) && !isNaN(secB)) return secA - secB;
      return a.Section.localeCompare(b.Section);
    });
    sectionsByCourse.set(code, matching);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
            3
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">Choose 1 Section Per Course</h2>
            <p className="text-xs text-slate-500 truncate">
              Select one preferred section for each of your courses
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAutoSelectAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Pick 1st Section</span>
        </button>
      </div>

      <div className="space-y-6">
        {matchedCodes.map((code) => {
          const availableSections = sectionsByCourse.get(code) || [];
          const currentChosenSection = selectedSections[code];
          const courseTitle = getDisplayTitle(availableSections);
          const credits = availableSections[0]?.Credit || '3';
          const isCourseConflicting = conflictingCourseKeys.has(`${code}__${currentChosenSection}`);
          const displayChosenSec = getDisplaySection(currentChosenSection || '');

          return (
            <div
              key={code}
              className={`rounded-xl border p-4 transition min-w-0 overflow-hidden ${
                isCourseConflicting
                  ? 'border-rose-300 bg-rose-50/30'
                  : currentChosenSection
                  ? 'border-slate-300 bg-slate-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Course Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0">
                    {code}
                  </span>
                  {courseTitle && (
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[320px]" title={courseTitle}>
                      {courseTitle}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">({credits} Cr)</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {currentChosenSection ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                        isCourseConflicting
                          ? 'bg-rose-100 text-rose-700 font-semibold'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isCourseConflicting ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span className="truncate max-w-[180px]">Sec {displayChosenSec} (Conflicting)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[180px]">Sec {displayChosenSec} Selected</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Please select a section</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveCourse(code)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200 hover:border-rose-200 bg-white shadow-2xs"
                    title={`Remove ${code} completely`}
                    aria-label={`Drop course ${code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section list / cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {availableSections.map((secRow) => {
                  const secNum = secRow.Section;
                  const displaySec = getDisplaySection(secNum);
                  const isSelected = currentChosenSection === secNum;
                  const hasConflict = conflictingCourseKeys.has(`${code}__${secNum}`);

                  return (
                    <button
                      key={secNum}
                      type="button"
                      onClick={() => onSelectSection(code, secNum)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all relative flex flex-col justify-between overflow-hidden min-w-0 ${
                        isSelected
                          ? hasConflict
                            ? 'border-rose-500 bg-rose-100/70 text-rose-900 shadow-sm ring-2 ring-rose-400'
                            : 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2 min-w-0">
                        <div className="flex items-center gap-2 font-bold min-w-0 flex-1 overflow-hidden">
                          <span
                            className={`min-w-[1.75rem] max-w-[3.5rem] h-6 px-1.5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 truncate ${
                              isSelected
                                ? hasConflict
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                            title={displaySec}
                          >
                            {isSelected ? '✓' : displaySec}
                          </span>
                          <span className="truncate min-w-0 font-bold" title={`Section ${displaySec}`}>
                            Section {displaySec}
                          </span>
                        </div>

                        {hasConflict && isSelected && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 border border-rose-300 shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            <span>Conflict</span>
                          </span>
                        )}
                      </div>

                      {/* Schedule info */}
                      <div className="py-2 space-y-1.5 font-mono text-[11px] min-w-0">
                        {/* Session 1 */}
                        <div className="flex items-start gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 truncate">
                            <span className="font-semibold text-slate-800 mr-1">{secRow.Day1}</span>
                            <span className="truncate">{secRow.Time1}</span>
                            {secRow.Room1 && (
                              <span className="text-slate-500 ml-1">
                                [{secRow.Room1}]
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Session 2 (if present) */}
                        {secRow.Day2 && secRow.Time2 && (
                          <div className="flex items-start gap-1.5 text-slate-600 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 truncate">
                              <span className="font-semibold text-slate-800 mr-1">{secRow.Day2}</span>
                              <span className="truncate">{secRow.Time2}</span>
                              {secRow.Room2 && (
                                <span className="text-slate-500 ml-1">
                                  [{secRow.Room2}]
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Faculty Info */}
                      {(() => {
                        const { name: facultyName, initial: facultyInitial, isTba } = formatFaculty(
                          secRow['Faculty Name'],
                          secRow['Faculty Initial']
                        );

                        return (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden" title={facultyName}>
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span
                                className={`truncate font-medium ${
                                  isTba ? 'text-slate-400 italic' : 'text-slate-700'
                                }`}
                              >
                                {facultyName}
                              </span>
                            </div>
                            {!isTba && facultyInitial && (
                              <span
                                className="font-semibold text-slate-800 font-mono bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0"
                                title={`Faculty Initial: ${facultyInitial}`}
                              >
                                {facultyInitial}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
