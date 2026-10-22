import React from 'react';
import { CalendarDays, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface NavbarProps {
  offeringCount: number;
  selectedCount: number;
  conflictCount: number;
  onLoadDemo: () => void;
  onOpenBrowser: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  offeringCount,
  selectedCount,
  conflictCount,
  onLoadDemo,
  onOpenBrowser,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Course Schedule Matrix Builder
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Automated offering PDF parser, live conflict detector & timetable planner
              </p>
            </div>
          </div>

          {/* Actions & Privacy Badge */}
          <div className="flex items-center gap-3">
            {/* Privacy Guarantee */}
            <div
              className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg"
              title="All processing is performed directly in your browser. No files are uploaded to any server."
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">100% Private (No Server Uploads)</span>
            </div>

            {/* Browse Offering Button */}
            {offeringCount > 0 && (
              <button
                type="button"
                onClick={onOpenBrowser}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Search Offering ({offeringCount})</span>
              </button>
            )}

            {/* Load Demo Data Button */}
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 transition shadow-sm shadow-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
