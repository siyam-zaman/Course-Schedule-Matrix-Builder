import { OfferingRow, ParseProgress } from '../types/schedule';
import { parsePdfBuffer } from './pdfWorker';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB hard limit

export interface ParseOptions {
  onProgress?: (progress: ParseProgress) => void;
}

/**
 * Validates offering PDF file before any parsing starts.
 * Rejects files > 25MB or non-PDF files immediately.
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 25 MB.`,
    };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF files (.pdf) are accepted.',
    };
  }

  return { valid: true };
}

/**
 * Parses an offering PDF using a dedicated Web Worker to prevent UI freezing.
 * Gracefully falls back to main-thread execution if Web Worker spawning fails.
 */
export async function parseOfferingPdf(
  file: File,
  options?: ParseOptions
): Promise<OfferingRow[]> {
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = await file.arrayBuffer();

  // Attempt Web Worker execution
  try {
    return await new Promise<OfferingRow[]>((resolve, reject) => {
      const worker = new Worker(new URL('./pdfWorker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.type === 'PROGRESS') {
          options?.onProgress?.({
            currentPage: data.current,
            totalPages: data.total,
            percentage: data.percentage,
            status: `Parsing page ${data.current} of ${data.total}...`,
          });
        } else if (data.type === 'SUCCESS') {
          worker.terminate();
          resolve(data.rows);
        } else if (data.type === 'ERROR') {
          worker.terminate();
          reject(new Error(data.error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };

      // Send buffer to worker
      worker.postMessage({ type: 'PARSE_OFFERING', buffer }, [buffer]);
    });
  } catch (workerErr: any) {
    console.warn('Web Worker execution failed or was blocked; falling back to main-thread parsing:', workerErr);
    // If worker fails (e.g. transfer consumed buffer or worker blocked), reload buffer if needed and run fallback
    const fallbackBuffer = buffer.byteLength === 0 ? await file.arrayBuffer() : buffer;
    return await parsePdfBuffer(fallbackBuffer, (curr, total) => {
      options?.onProgress?.({
        currentPage: curr,
        totalPages: total,
        percentage: Math.round((curr / total) * 100),
        status: `Parsing page ${curr} of ${total}...`,
      });
    });
  }
}
