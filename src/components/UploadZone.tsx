import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ParseProgress } from '../types/schedule';
import { MAX_FILE_SIZE_BYTES } from '../utils/pdfParserClient';

interface UploadZoneProps {
  id: string;
  title: string;
  subtitle: string;
  acceptNotice?: string;
  file: File | null;
  isParsing: boolean;
  progress: ParseProgress | null;
  error: string | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  id,
  title,
  subtitle,
  acceptNotice = 'PDF files up to 25 MB supported',
  file,
  isParsing,
  progress,
  error,
  onFileSelect,
  onFileRemove,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isParsing) setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isParsing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isParsing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={handleFileInputChange}
        disabled={disabled || isParsing}
        aria-label={title}
      />

      {!file ? (
        <div
          role="region"
          aria-label={title}
          tabIndex={disabled || isParsing ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isParsing) fileInputRef.current?.click();
          }}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDragOver ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
              } transition-colors`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <span>{acceptNotice}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                {isParsing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {file.size > MAX_FILE_SIZE_BYTES && (
                    <span className="text-rose-600 font-semibold ml-2">Exceeds 25 MB limit!</span>
                  )}
                </p>
              </div>
            </div>

            {!isParsing && (
              <button
                type="button"
                onClick={onFileRemove}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Remove file"
                aria-label="Remove uploaded file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Parsing Progress Bar */}
          {isParsing && progress && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>{progress.status}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Checkmark */}
          {!isParsing && !error && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">File loaded and parsed successfully</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mt-2.5 flex items-start gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Upload or Parsing Error:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
};
