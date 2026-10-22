import { describe, it, expect } from 'vitest';
import { formatFaculty } from './formatFaculty';

describe('formatFaculty', () => {
  it('displays real faculty name and initial when available', () => {
    const res = formatFaculty('Mohsina Rahman', 'MoRhn');
    expect(res.name).toBe('Mohsina Rahman');
    expect(res.initial).toBe('MoRhn');
    expect(res.isTba).toBe(false);
  });

  it('displays TBA and no initial when faculty name is TBA', () => {
    const res = formatFaculty('TBA', 'MoRhn');
    expect(res.name).toBe('TBA');
    expect(res.initial).toBeNull();
    expect(res.isTba).toBe(true);
  });

  it('displays TBA when faculty name contains TBA', () => {
    const res = formatFaculty('T.B.A.', '');
    expect(res.name).toBe('TBA');
    expect(res.initial).toBeNull();
    expect(res.isTba).toBe(true);
  });

  it('displays TBA when both name and initial are empty', () => {
    const res = formatFaculty('', '');
    expect(res.name).toBe('TBA');
    expect(res.initial).toBeNull();
    expect(res.isTba).toBe(true);
  });

  it('extracts name and initial if full name was lumped into initial', () => {
    const res = formatFaculty('', 'Mohsina Rahman MoRhn');
    expect(res.name).toBe('Mohsina Rahman');
    expect(res.initial).toBe('MoRhn');
    expect(res.isTba).toBe(false);
  });

  it('omits initial badge if initial is TBA or identical to name', () => {
    const res1 = formatFaculty('Dr. Smith', 'TBA');
    expect(res1.name).toBe('Dr. Smith');
    expect(res1.initial).toBeNull();

    const res2 = formatFaculty('Dr. Smith', 'Dr. Smith');
    expect(res2.name).toBe('Dr. Smith');
    expect(res2.initial).toBeNull();
  });
});
