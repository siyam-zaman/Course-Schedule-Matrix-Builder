/**
 * Normalizes faculty name and initial for consistent UI display across all components.
 * 
 * Rules:
 * - If the faculty name contains "TBA" (case-insensitive) or is empty (with no instructor), return "TBA" with no initial badge.
 * - If faculty name doesn't contain "TBA", return the real faculty name on the left, and if a valid initial exists (not TBA and not identical), return it on the right.
 * - Never display "TBA" and a real instructor name together.
 */
export interface FacultyDisplay {
  name: string;
  initial: string | null;
  isTba: boolean;
}

export function formatFaculty(rawName?: string, rawInitial?: string): FacultyDisplay {
  const name = (rawName || '').trim();
  const init = (rawInitial || '').trim();

  // Check if name or initial contains "TBA" or is unassigned
  const isNameTba = !name || /tba/i.test(name) || /t\.b\.a\./i.test(name) || /to be announced/i.test(name);
  const isInitTba = !init || /tba/i.test(init) || /t\.b\.a\./i.test(init);

  // If faculty name explicitly contains TBA or is empty without a real instructor initial
  if (isNameTba && isInitTba) {
    return { name: 'TBA', initial: null, isTba: true };
  }

  // If faculty name contains TBA, per user instruction: show "TBA"
  if (name && (/tba/i.test(name) || /t\.b\.a\./i.test(name) || /to be announced/i.test(name))) {
    return { name: 'TBA', initial: null, isTba: true };
  }

  let finalName = name;
  let finalInitial = init;

  // If name was empty but initial has the instructor
  if (!finalName && finalInitial && !isInitTba) {
    // If multiple words, e.g. "Mohsina Rahman MoRhn"
    const parts = finalInitial.split(/\s+/);
    if (parts.length > 1) {
      finalInitial = parts.pop() || '';
      finalName = parts.join(' ');
    } else {
      finalName = finalInitial;
      finalInitial = '';
    }
  }

  // If initial contains TBA, or is identical to the full name, hide it
  if (
    finalInitial &&
    (/tba/i.test(finalInitial) || finalInitial.toLowerCase() === finalName.toLowerCase())
  ) {
    finalInitial = '';
  }

  return {
    name: finalName || 'TBA',
    initial: finalInitial || null,
    isTba: !finalName || /tba/i.test(finalName),
  };
}
