import React, { useState, useMemo, useEffect } from 'react';
import { OfferingRow, ParseProgress } from './types/schedule';
import { parseOfferingPdf } from './utils/pdfParserClient';
import { processCourseSelection, normalizeCodeKey, parseManualCourseInput } from './utils/courseExtractor';
import { detectConflicts } from './utils/conflictDetector';
import { SAMPLE_OFFERING_DATA } from './utils/sampleData';

import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { CourseInput } from './components/CourseInput';
import { SectionPicker } from './components/SectionPicker';
import { ConflictSummary } from './components/ConflictSummary';
import { ScheduleTable } from './components/ScheduleTable';
import { TimetableGrid } from './components/TimetableGrid';
import { OfferingBrowser } from './components/OfferingBrowser';

import {
  FileText,
  Calendar,
  Grid,
  Table as TableIcon,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  // Offering PDF upload & parse states
  const [offeringFile, setOfferingFile] = useState<File | null>(null);
  const [isParsingOffering, setIsParsingOffering] = useState<boolean>(false);
  const [offeringProgress, setOfferingProgress] = useState<ParseProgress | null>(null);
  const [offeringError, setOfferingError] = useState<string | null>(null);
  const [offeringRows, setOfferingRows] = useState<OfferingRow[]>([]);

  // Course input states
  const [pdfCourseCodes, setPdfCourseCodes] = useState<string[]>([]);
  const [manualCourseText, setManualCourseText] = useState<string>('');

  // Chosen sections: { "CSE115": "1", "MAT120": "2" }
  const [selectedSections, setSelectedSections] = useState<Record<string, string>>({});

  // View state: 'matrix' (Schedule Table) or 'grid' (Weekly Visual Timetable)
  const [activeTab, setActiveTab] = useState<'matrix' | 'grid'>('matrix');

  // Offering search browser modal
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);

  // Derived: All unique course codes available in the offering
  const availableOfferingCodes = useMemo(() => {
    const set = new Set<string>();
    offeringRows.forEach((r) => {
      const code = (r['Course Code'] || '').trim().toUpperCase();
      if (code) set.add(code);
    });
    return Array.from(set).sort();
  }, [offeringRows]);

  // Derived: Merged & matched course codes
  const { matchedCodes, unmatchedCodes } = useMemo(() => {
    return processCourseSelection(pdfCourseCodes, manualCourseText, availableOfferingCodes);
  }, [pdfCourseCodes, manualCourseText, availableOfferingCodes]);

  // Auto-pick section 1 for new courses if none chosen
  useEffect(() => {
    setSelectedSections((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const code of matchedCodes) {
        if (!next[code]) {
          // Find first available section in offering
          const firstSec = offeringRows.find(
            (r) => (r['Course Code'] || '').trim().toUpperCase() === code
          )?.Section;
          if (firstSec) {
            next[code] = firstSec;
            changed = true;
          }
        }
      }

      // Cleanup codes that were removed from matchedCodes
      for (const code of Object.keys(next)) {
        if (!matchedCodes.includes(code)) {
          delete next[code];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [matchedCodes, offeringRows]);

  // Derived: Rows for chosen sections
  const chosenRows: OfferingRow[] = useMemo(() => {
    const list: OfferingRow[] = [];
    matchedCodes.forEach((code) => {
      const sec = selectedSections[code];
      if (sec) {
        const foundRow = offeringRows.find(
          (r) =>
            (r['Course Code'] || '').trim().toUpperCase() === code &&
            (r.Section || '').trim() === sec.trim()
        );
        if (foundRow) {
          list.push(foundRow);
        }
      }
    });
    return list;
  }, [matchedCodes, selectedSections, offeringRows]);

  // Derived: Conflict analysis (Live updates)
  const conflictAnalysis = useMemo(() => {
    return detectConflicts(chosenRows);
  }, [chosenRows]);

  // Handler: Offering File Upload
  const handleOfferingFileSelect = async (file: File) => {
    setOfferingFile(file);
    setOfferingError(null);
    setIsParsingOffering(true);
    setOfferingProgress({
      currentPage: 1,
      totalPages: 1,
      percentage: 5,
      status: 'Analyzing PDF structure and text streams in Web Worker...',
    });

    try {
      const rows = await parseOfferingPdf(file, {
        onProgress: (prog) => {
          setOfferingProgress(prog);
        },
      });

      if (rows.length === 0) {
        throw new Error('No course rows could be extracted from this PDF.');
      }

      setOfferingRows(rows);
      setOfferingProgress(null);
    } catch (err: any) {
      console.error('Offering parse error:', err);
      setOfferingError(err.message || 'Failed to parse the offering PDF.');
    } finally {
      setIsParsingOffering(false);
    }
  };

  const handleOfferingFileRemove = () => {
    setOfferingFile(null);
    setOfferingRows([]);
    setOfferingError(null);
    setOfferingProgress(null);
    setSelectedSections({});
  };

  // Handler: Preload Sample Offering
  const handleLoadDemo = () => {
    setOfferingFile(new File(['dummy'], 'University_Official_Offering_Fall.pdf', { type: 'application/pdf' }));
    setOfferingError(null);
    setOfferingRows(SAMPLE_OFFERING_DATA);
    setManualCourseText('CSE115, MAT120, PHY107, ENG102');
    setSelectedSections({
      CSE115: '1',
      MAT120: '1', // Intentionally conflicts with CSE115 Sec 1 to show conflict detection immediately
      PHY107: '1',
      ENG102: '2',
    });
  };

  // Handler: Quick add single course code from browser or input
  const handleAddCourseCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (!manualCourseText.toUpperCase().includes(clean)) {
      setManualCourseText((prev) => (prev ? `${prev}, ${clean}` : clean));
    }
  };

  // Handler: Select specific section
  const handleSelectSection = (courseCode: string, section: string) => {
    setSelectedSections((prev) => ({
      ...prev,
      [courseCode]: section,
    }));
  };

  // Handler: Auto-select 1st section for all matched courses
  const handleAutoSelectAll = () => {
    const next: Record<string, string> = {};
    matchedCodes.forEach((code) => {
      const firstSec = offeringRows.find(
        (r) => (r['Course Code'] || '').trim().toUpperCase() === code
      )?.Section;
      if (firstSec) {
        next[code] = firstSec;
      }
    });
    setSelectedSections(next);
  };

  // Handler: Clear all course selections
  const handleClearAllCourses = () => {
    setPdfCourseCodes([]);
    setManualCourseText('');
    setSelectedSections({});
  };

  // Handler: Remove/delete a specific course
  const handleRemoveCourse = (codeToRemove: string) => {
    const targetKey = normalizeCodeKey(codeToRemove);

    // 1. Remove from pdfCourseCodes
    setPdfCourseCodes((prev) =>
      prev.filter((c) => normalizeCodeKey(c) !== targetKey)
    );

    // 2. Remove from manualCourseText cleanly
    setManualCourseText((prev) => {
      const tokens = parseManualCourseInput(prev);
      const filtered = tokens.filter((t) => normalizeCodeKey(t) !== targetKey);
      return filtered.join(', ');
    });

    // 3. Remove from selectedSections
    setSelectedSections((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (normalizeCodeKey(k) === targetKey) {
          delete next[k];
        }
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        offeringCount={offeringRows.length}
        selectedCount={chosenRows.length}
        conflictCount={conflictAnalysis.conflicts.length}
        onLoadDemo={handleLoadDemo}
        onOpenBrowser={() => setIsBrowserOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          {/* Step 1: Offering PDF Upload Zone */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex-1">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upload Offering PDF</h2>
                  <p className="text-xs text-slate-500">
                    Parse full university schedule (25 MB max, client-side Web Worker)
                  </p>
                </div>
              </div>

              <UploadZone
                id="offering-pdf-upload"
                title="University Offering PDF"
                subtitle="Table with 14 columns: sl, Program, Course Code, Title, Section, Room1/2, Day1/2, Time1/2, Faculty, Credit"
                acceptNotice="Hard limit: 25 MB • PDF files only"
                file={offeringFile}
                isParsing={isParsingOffering}
                progress={offeringProgress}
                error={offeringError}
                onFileSelect={handleOfferingFileSelect}
                onFileRemove={handleOfferingFileRemove}
              />

              {offeringRows.length > 0 && !isParsingOffering && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                  <div>
                    <span className="font-bold">{offeringRows.length}</span> total class sections loaded
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBrowserOpen(true)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Browse & Search All
                  </button>
                </div>
              )}

              {offeringRows.length === 0 && !isParsingOffering && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>Don't have a schedule PDF on hand right now? Click </span>
                    <button
                      type="button"
                      onClick={handleLoadDemo}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      "Load Sample Demo"
                    </button>
                    <span> at the top right to instantly test with realistic courses!</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Course Selection */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <CourseInput
              manualText={manualCourseText}
              pdfCourses={pdfCourseCodes}
              matchedCodes={matchedCodes}
              unmatchedCodes={unmatchedCodes}
              availableOfferingCodes={availableOfferingCodes}
              onManualTextChange={setManualCourseText}
              onPdfCoursesExtracted={(codes) => {
                setPdfCourseCodes((prev) => Array.from(new Set([...prev, ...codes])));
              }}
              onClearAll={handleClearAllCourses}
              onAddCourseCode={handleAddCourseCode}
              onRemoveCourse={handleRemoveCourse}
              disabled={offeringRows.length === 0}
            />
          </div>
        </div>

        {/* Step 3: Section Picker (Appears when matched courses exist) */}
        {offeringRows.length > 0 && matchedCodes.length > 0 && (
          <div className="print:hidden">
            <SectionPicker
              matchedCodes={matchedCodes}
              allOfferingRows={offeringRows}
              selectedSections={selectedSections}
              conflictingSessionKeys={conflictAnalysis.conflictingSessionKeys}
              conflictingCourseKeys={conflictAnalysis.conflictingCourseKeys}
              onSelectSection={handleSelectSection}
              onAutoSelectAll={handleAutoSelectAll}
              onRemoveCourse={handleRemoveCourse}
            />
          </div>
        )}

        {/* Live Conflict Summary Banner */}
        <ConflictSummary
          conflicts={conflictAnalysis.conflicts}
          selectedCount={chosenRows.length}
        />

        {/* Output Section: Tabs for Matrix Table & Weekly Timetable Grid */}
        {chosenRows.length > 0 && (
          <div className="space-y-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 print:hidden">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition ${
                    activeTab === 'matrix'
                      ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>14-Column Matrix Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('grid')}
                  className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition ${
                    activeTab === 'grid'
                      ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Weekly Timetable Visualizer</span>
                </button>
              </div>

              {conflictAnalysis.conflicts.length > 0 && (
                <div className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pr-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{conflictAnalysis.conflicts.length} Conflict(s) in Current View</span>
                </div>
              )}
            </div>

            {/* Matrix Table View */}
            <div className={activeTab === 'matrix' ? 'block' : 'hidden print:block'}>
              <ScheduleTable
                chosenRows={chosenRows}
                conflictingCourseKeys={conflictAnalysis.conflictingCourseKeys}
                conflictingSessionKeys={conflictAnalysis.conflictingSessionKeys}
                hasConflicts={conflictAnalysis.conflicts.length > 0}
                onRemoveCourse={handleRemoveCourse}
              />
            </div>

            {/* Weekly Timetable Grid View */}
            <div className={activeTab === 'grid' ? 'block' : 'hidden'}>
              <TimetableGrid
                chosenRows={chosenRows}
                conflictingSessionKeys={conflictAnalysis.conflictingSessionKeys}
                conflictingCourseKeys={conflictAnalysis.conflictingCourseKeys}
              />
            </div>
          </div>
        )}
      </main>

      {/* Offering Search & Filter Modal */}
      <OfferingBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        offeringRows={offeringRows}
        selectedCodes={matchedCodes}
        onAddCourseCode={handleAddCourseCode}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">Course Schedule Matrix Builder</p>
        <p>100% Client-Side React Application. Powered by pdf.js with Web Worker text-position reconstruction.</p>
      </footer>
    </div>
  );
};
