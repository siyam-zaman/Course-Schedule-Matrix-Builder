import React, { useState } from 'react';
import { BookMarked, UploadCloud, FileCheck, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { extractCoursesFromPdf } from '../utils/courseExtractor';

interface CourseInputProps {
  manualText: string;
  pdfCourses: string[];
  matchedCodes: string[];
  unmatchedCodes: string[];
  availableOfferingCodes: string[];
  onManualTextChange: (text: string) => void;
  onPdfCoursesExtracted: (codes: string[]) => void;
  onClearAll: () => void;
  onAddCourseCode: (code: string) => void;
  onRemoveCourse: (code: string) => void;
  disabled?: boolean;
}

export const CourseInput: React.FC<CourseInputProps> = ({
  manualText,
  pdfCourses,
  matchedCodes,
  unmatchedCodes,
  availableOfferingCodes,
  onManualTextChange,
  onPdfCoursesExtracted,
  onClearAll,
  onAddCourseCode,
  onRemoveCourse,
  disabled = false,
}) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');

  const handleSecondPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF file.');
      return;
    }

    try {
      setIsPdfLoading(true);
      setPdfFileName(file.name);
      const extracted = await extractCoursesFromPdf(file, availableOfferingCodes);
      onPdfCoursesExtracted(extracted);
    } catch (err: any) {
      console.error('Failed to extract courses from PDF:', err);
      alert('Could not extract text from this PDF. Please use the manual text box below.');
    } finally {
      setIsPdfLoading(false);
      e.target.value = '';
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onAddCourseCode(quickInput.trim().toUpperCase());
    setQuickInput('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Select Your Courses</h2>
            <p className="text-xs text-slate-500">
              Upload advising / registration PDF or type course codes
            </p>
          </div>
        </div>

        {(matchedCodes.length > 0 || unmatchedCodes.length > 0 || manualText.trim().length > 0) && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition"
            title="Clear all course inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Method A: Second PDF upload */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>Option A: Upload Advising Slip / Degree Plan PDF</span>
          {pdfFileName && (
            <span className="text-[11px] font-normal text-indigo-600 truncate max-w-[200px]">
              {pdfFileName}
            </span>
          )}
        </label>
        <div className="flex items-center gap-3">
          <label
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-xs font-medium text-slate-700 cursor-pointer transition ${
              disabled || isPdfLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>{isPdfLoading ? 'Scanning PDF text...' : 'Upload 2nd PDF to auto-extract'}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleSecondPdfUpload}
              disabled={disabled || isPdfLoading}
            />
          </label>
        </div>
      </div>

      {/* Method B: Manual text input */}
      <div className="space-y-2">
        <label htmlFor="course-codes-input" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>Option B: Manual Course Codes (Comma, space, or newline separated)</span>
          <span className="text-[11px] font-normal text-slate-400">e.g. CSE115, MAT120, PHY107</span>
        </label>
        <textarea
          id="course-codes-input"
          rows={3}
          value={manualText}
          onChange={(e) => onManualTextChange(e.target.value)}
          placeholder="Type or paste codes here (e.g., CSE115, MAT120, PHY107, ENG102)..."
          disabled={disabled}
          className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition"
        />

        {/* Quick single code add form */}
        <form onSubmit={handleQuickAdd} className="flex gap-2 pt-1">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Quick add single code (e.g. CSE215)"
            disabled={disabled}
            className="flex-1 text-xs uppercase px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
          />
          <button
            type="submit"
            disabled={disabled || !quickInput.trim()}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Badges / Output status */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {/* Matched Codes */}
        {matchedCodes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Matched in Offering ({matchedCodes.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchedCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  <BookMarked className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{code}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveCourse(code)}
                    className="p-0.5 rounded hover:bg-emerald-200/80 text-emerald-600 hover:text-emerald-950 transition"
                    title={`Remove ${code}`}
                    aria-label={`Remove course ${code}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched Codes Alert */}
        {unmatchedCodes.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Not Found in Offering PDF ({unmatchedCodes.length}):</span>
            </div>
            <p className="text-[11px] text-amber-800">
              The following requested codes do not match any course in the uploaded offering:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {unmatchedCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-100/80 text-amber-900 border border-amber-300"
                >
                  <span>{code}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveCourse(code)}
                    className="p-0.5 rounded hover:bg-amber-200 text-amber-700 hover:text-amber-950 transition"
                    title={`Remove ${code}`}
                    aria-label={`Remove course ${code}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {matchedCodes.length === 0 && unmatchedCodes.length === 0 && (
          <p className="text-xs text-slate-400 italic">
            No course codes entered yet. Upload a registration PDF or type course codes above.
          </p>
        )}
      </div>
    </div>
  );
};
