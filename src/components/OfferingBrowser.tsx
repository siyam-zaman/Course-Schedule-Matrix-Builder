import React, { useState, useMemo } from 'react';
import { OfferingRow } from '../types/schedule';
import { Search, X, Plus, Check, Filter } from 'lucide-react';
import { formatFaculty } from '../utils/formatFaculty';

interface OfferingBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  offeringRows: OfferingRow[];
  selectedCodes: string[];
  onAddCourseCode: (code: string) => void;
}

export const OfferingBrowser: React.FC<OfferingBrowserProps> = ({
  isOpen,
  onClose,
  offeringRows,
  selectedCodes,
  onAddCourseCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  // Extract unique programs
  const programs = useMemo(() => {
    const set = new Set<string>();
    offeringRows.forEach((r) => {
      if (r.Program && r.Program.trim()) set.add(r.Program.trim());
    });
    return Array.from(set).sort();
  }, [offeringRows]);

  // Filter rows
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return offeringRows.filter((row) => {
      if (selectedProgram !== 'ALL' && row.Program !== selectedProgram) {
        return false;
      }
      if (!term) return true;
      const code = (row['Course Code'] || '').toLowerCase();
      const title = (row.Title || '').toLowerCase();
      const faculty = (row['Faculty Name'] || '').toLowerCase();
      const initial = (row['Faculty Initial'] || '').toLowerCase();
      const day1 = (row.Day1 || '').toLowerCase();
      const room = (row.Room1 || '').toLowerCase();
      return (
        code.includes(term) ||
        title.includes(term) ||
        faculty.includes(term) ||
        initial.includes(term) ||
        day1.includes(term) ||
        room.includes(term)
      );
    });
  }, [offeringRows, searchTerm, selectedProgram]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offering-browser-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="offering-browser-title" className="text-lg font-bold text-slate-900">
              Browse & Search Full Course Offering
            </h2>
            <p className="text-xs text-slate-500">
              {offeringRows.length} total sections available in this offering PDF
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code (e.g. CSE115), title, faculty, or day..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {programs.length > 1 && (
            <div className="flex items-center gap-2 sm:w-48">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                <option value="ALL">All Programs</option>
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching courses found for "{searchTerm}".
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Sec</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3">Faculty</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((row, idx) => {
                    const code = (row['Course Code'] || '').trim().toUpperCase();
                    const isAdded = selectedCodes.includes(code);

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">{code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{row.Title}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{row.Section}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          <div>
                            {row.Day1} {row.Time1}
                          </div>
                          {row.Day2 && row.Time2 && (
                            <div className="text-slate-400">
                              {row.Day2} {row.Time2}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {(() => {
                            const { name: fName, initial: fInit, isTba } = formatFaculty(
                              row['Faculty Name'],
                              row['Faculty Initial']
                            );
                            if (isTba) {
                              return <span className="text-slate-400 italic">TBA</span>;
                            }
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{fName}</span>
                                {fInit && (
                                  <span className="font-semibold text-slate-700 font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                                    {fInit}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{row.Room1 || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onAddCourseCode(code)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              isAdded
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>In List</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRows.length} of {offeringRows.length} total entries</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
