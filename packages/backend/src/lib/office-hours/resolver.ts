import type { Interval } from './availability.js';

// ISO 8601 day-of-week: 1=Monday … 7=Sunday.
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TemplateRow = {
  dayOfWeek: DayOfWeek;
  intervals: Interval[];
  notes: string | null;
};

export type OverrideRow = {
  date: string; // YYYY-MM-DD in Asia/Almaty
  intervals: Interval[];
  notes: string | null;
};

export type ResolverInput = {
  template: TemplateRow[];
  overrides: OverrideRow[];
  date: string; // YYYY-MM-DD in Asia/Almaty
};

export type ResolverOutput = {
  intervals: Interval[];
  notes: string | null;
  source: 'template' | 'override' | 'none';
};

const isoDayOfWeekFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Almaty',
  weekday: 'short',
});

const ISO_DOW: Record<string, DayOfWeek> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function isoDayOfWeekFor(date: string): DayOfWeek {
  // Trick: интерпретируем YYYY-MM-DD как полдень UTC, форматируем в Asia/Almaty.
  // Полдень UTC всегда попадает в тот же календарный день в Almaty (UTC+5).
  const [y, m, d] = date.split('-').map((v) => Number.parseInt(v, 10));
  const instant = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  const weekday = isoDayOfWeekFormatter.format(instant);
  return ISO_DOW[weekday]!;
}

export function resolve(input: ResolverInput): ResolverOutput {
  const ov = input.overrides.find((o) => o.date === input.date);
  if (ov) {
    return { intervals: ov.intervals, notes: ov.notes, source: 'override' };
  }
  const dow = isoDayOfWeekFor(input.date);
  const tpl = input.template.find((t) => t.dayOfWeek === dow);
  if (tpl) {
    return { intervals: tpl.intervals, notes: tpl.notes, source: 'template' };
  }
  return { intervals: [], notes: null, source: 'none' };
}
