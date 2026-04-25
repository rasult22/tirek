import type { Interval } from './availability.js';

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validate(intervals: Interval[]): ValidationResult {
  for (const { start, end } of intervals) {
    if (!HHMM.test(start) || !HHMM.test(end)) {
      return { ok: false, reason: `Invalid HH:mm format: ${start}-${end}` };
    }
    if (start >= end) {
      return { ok: false, reason: `Interval end must be after start: ${start}-${end}` };
    }
  }
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    if (curr.start < prev.end) {
      return {
        ok: false,
        reason: `Overlapping intervals: ${prev.start}-${prev.end} and ${curr.start}-${curr.end}`,
      };
    }
  }
  return { ok: true };
}
