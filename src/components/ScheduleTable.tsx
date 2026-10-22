import React from 'react';
import { OfferingRow } from '../types/schedule';
import { Download, Printer, AlertCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { downloadCsv } from '../utils/csvExporter';
import { formatFaculty } from '../utils/formatFaculty';

interface ScheduleTableProps {
  chosenRows: OfferingRow[];
  conflictingCourseKeys: Set<string>;
  conflictingSessionKeys: Set<string>;
  hasConflicts?: boolean;
  onRemoveCourse?: (code: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  chosenRows,
  conflictingCourseKeys,
  conflictingSessionKeys,
  hasConflicts,
  onRemoveCourse,
}) => {
  const isBlocked =
    hasConflicts !== undefined
      ? hasConflicts
      : conflictingCourseKeys.size > 0 || conflictingSessionKeys.size > 0;

  if (chosenRows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">No Courses Selected Yet</p>
        <p className="text-xs text-slate-400">
          Upload an offering PDF, specify course codes, and pick your sections to generate your matrix.
        </p>
      </div>
    );
  }

  // Calculate total credits
  const totalCredits = chosenRows.reduce((sum, row) => {
    const val = parseFloat(row.Credit || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handlePrint = () => {
    if (isBlocked) return;
    window.print();
  };

  const handleExportCsv = () => {
    if (isBlocked) return;
    downloadCsv(chosenRows, 'my_course_schedule_matrix.csv');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      {/* Table Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Course Schedule Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {chosenRows.length} Course{chosenRows.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Official 14-column schedule matrix with live conflict detection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isBlocked && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Time conflict detected — Export & Print disabled</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isBlocked}
            title={
              isBlocked
                ? 'Export disabled: Please resolve time conflicts first'
                : 'Export official schedule matrix to CSV'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition shadow-xs ${
              isBlocked
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-400'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isBlocked}
            title={
              isBlocked
                ? 'Print disabled: Please resolve time conflicts first'
                : 'Print official schedule matrix'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-xs ${
              isBlocked
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Schedule</span>
          </button>
        </div>
      </div>

      {/* Printable Schedule Title for Print View */}
      <div className="hidden print:block mb-4">
        {isBlocked ? (
          <div className="p-4 border-2 border-red-500 rounded bg-red-50 text-red-700 text-sm font-bold text-center">
            ⚠ Schedule cannot be printed because active time conflicts exist. Please resolve all conflicts in the schedule matrix first.
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-black">Official Course Schedule Matrix</h1>
            <p className="text-xs text-neutral-600">Generated by Course Schedule Matrix Builder</p>
          </>
        )}
      </div>

      {/* 14-column Table with responsive horizontal scroll */}
      <div
        className={`overflow-x-auto rounded-xl border border-slate-200 print:border-neutral-300 ${
          isBlocked ? 'print:hidden' : 'print:overflow-visible'
        }`}
      >
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans print:divide-neutral-300">
          <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px] print:bg-neutral-100">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">sl</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Program</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Course Code</th>
              <th className="py-2.5 px-3 min-w-[180px]">Title</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Section</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Room1</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Room2</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Day1</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Day2</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Time1</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Time2</th>
              <th className="py-2.5 px-3 min-w-[140px]">Faculty Name</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Faculty Initial</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">Credit</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white print:divide-neutral-300">
            {chosenRows.map((row, index) => {
              const code = (row['Course Code'] || '').trim().toUpperCase();
              const section = (row['Section'] || '').trim();
              const courseKey = `${code}__${section}`;
              const isConflicting = conflictingCourseKeys.has(courseKey);

              const isS1Conflicting = conflictingSessionKeys.has(`${courseKey}__S1`);
              const isS2Conflicting = conflictingSessionKeys.has(`${courseKey}__S2`);

              return (
                <tr
                  key={`${code}-${section}-${index}`}
                  className={`transition-colors ${
                    isConflicting
                      ? 'bg-red-100/80 hover:bg-red-100 text-red-900 border-l-4 border-l-red-600 print:bg-red-100'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-slate-50/80 text-slate-900'
                      : 'bg-slate-50/50 hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-medium">{row.sl || index + 1}</td>
                  <td className="py-2.5 px-3">{row.Program}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <div className="flex items-center gap-1.5">
                      <span>{row['Course Code']}</span>
                      {isConflicting && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shadow-2xs"
                          title="This class has a time conflict with another chosen course!"
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Conflict</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{row.Title}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">{row.Section}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{row.Room1 || '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{row.Room2 || '—'}</td>

                  {/* Day1 Cell: Stronger red if Session 1 has conflict */}
                  <td
                    className={`py-2.5 px-3 font-mono font-semibold ${
                      isS1Conflicting
                        ? 'bg-red-200 text-red-950 border border-red-400 font-bold print:bg-red-200'
                        : ''
                    }`}
                  >
                    {row.Day1 || '—'}
                  </td>

                  {/* Day2 Cell: Stronger red if Session 2 has conflict */}
                  <td
                    className={`py-2.5 px-3 font-mono font-semibold ${
                      isS2Conflicting
                        ? 'bg-red-200 text-red-950 border border-red-400 font-bold print:bg-red-200'
                        : ''
                    }`}
                  >
                    {row.Day2 || '—'}
                  </td>

                  {/* Time1 Cell: Stronger red if Session 1 has conflict */}
                  <td
                    className={`py-2.5 px-3 font-mono whitespace-nowrap ${
                      isS1Conflicting
                        ? 'bg-red-200 text-red-950 border border-red-400 font-bold print:bg-red-200'
                        : ''
                    }`}
                  >
                    {row.Time1 || '—'}
                  </td>

                  {/* Time2 Cell: Stronger red if Session 2 has conflict */}
                  <td
                    className={`py-2.5 px-3 font-mono whitespace-nowrap ${
                      isS2Conflicting
                        ? 'bg-red-200 text-red-950 border border-red-400 font-bold print:bg-red-200'
                        : ''
                    }`}
                  >
                    {row.Time2 || '—'}
                  </td>

                  {(() => {
                    const { name: fName, initial: fInit, isTba } = formatFaculty(
                      row['Faculty Name'],
                      row['Faculty Initial']
                    );
                    return (
                      <>
                        <td className={`py-2.5 px-3 ${isTba ? 'text-slate-400 italic' : ''}`}>
                          {fName}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {!isTba && fInit ? fInit : '—'}
                        </td>
                      </>
                    );
                  })()}
                  <td className="py-2.5 px-3 font-mono font-bold text-right">{row.Credit}</td>
                  <td className="py-2.5 px-3 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => onRemoveCourse?.(row['Course Code'])}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                      title={`Remove ${row['Course Code']} from schedule`}
                      aria-label={`Remove course ${row['Course Code']}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total Credits & Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Total Selected Courses:</span>
          <span className="font-bold text-slate-900">{chosenRows.length}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 font-medium">Total Credits:</span>
          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 font-mono">
            {totalCredits.toFixed(1)} Credits
          </span>
        </div>
      </div>
    </div>
  );
};
