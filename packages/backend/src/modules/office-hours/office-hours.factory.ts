import { validate as validateIntervals } from "../../lib/office-hours/intervals.js";
import {
  infoBlockFor,
  type DayEntry,
  type InfoBlock,
  type Interval,
} from "../../lib/office-hours/availability.js";
import {
  resolve as resolveOfficeHours,
  type DayOfWeek,
  type ResolverOutput,
} from "../../lib/office-hours/resolver.js";
import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors.js";

// ── Public types ──────────────────────────────────────────────────────

export type TemplateRecord = {
  id: string;
  psychologistId: string;
  dayOfWeek: DayOfWeek;
  intervals: Interval[];
  notes: string | null;
  updatedAt: Date;
};

export type OverrideRecord = {
  id: string;
  psychologistId: string;
  date: string;
  intervals: Interval[];
  notes: string | null;
  updatedAt: Date;
};

export type StudentPsychologistLink = {
  studentId: string;
  psychologistId: string;
};

export type OfficeHoursDeps = {
  findTemplateByPsychologist(psychologistId: string): Promise<TemplateRecord[]>;
  upsertTemplateDay(data: {
    psychologistId: string;
    dayOfWeek: DayOfWeek;
    intervals: Interval[];
    notes: string | null;
  }): Promise<TemplateRecord>;
  findOverridesByRange(
    psychologistId: string,
    from: string,
    to: string,
  ): Promise<OverrideRecord[]>;
  upsertOverrideDay(data: {
    psychologistId: string;
    date: string;
    intervals: Interval[];
    notes: string | null;
  }): Promise<OverrideRecord>;
  deleteOverrideDay(psychologistId: string, date: string): Promise<boolean>;
  findStudentPsychologistLink(studentId: string): Promise<StudentPsychologistLink | null>;
};

// ── Helpers ───────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string, field = "date"): void {
  if (!DATE_RE.test(value)) {
    throw new ValidationError(`Invalid ${field} format, expected YYYY-MM-DD`);
  }
}

function assertDayOfWeek(value: number): asserts value is DayOfWeek {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    throw new ValidationError("dayOfWeek must be integer in [1, 7] (1=Mon … 7=Sun)");
  }
}

function parseAndValidateIntervals(input: unknown): Interval[] {
  if (!Array.isArray(input)) {
    throw new ValidationError("intervals must be an array");
  }
  for (const entry of input) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as { start?: unknown }).start !== "string" ||
      typeof (entry as { end?: unknown }).end !== "string"
    ) {
      throw new ValidationError("each interval must be { start: HH:mm, end: HH:mm }");
    }
  }
  const intervals = input as Interval[];
  const result = validateIntervals(intervals);
  if (!result.ok) throw new ValidationError(result.reason);
  return intervals;
}

function nextDay(day: string): string {
  const [y, m, d] = day.split("-").map((v) => Number.parseInt(v, 10));
  const utc = new Date(Date.UTC(y!, m! - 1, d! + 1));
  return (
    `${utc.getUTCFullYear()}-` +
    `${String(utc.getUTCMonth() + 1).padStart(2, "0")}-` +
    `${String(utc.getUTCDate()).padStart(2, "0")}`
  );
}

// ── Factory ───────────────────────────────────────────────────────────

export type OfficeHoursService = ReturnType<typeof createOfficeHoursService>;

export function createOfficeHoursService(deps: OfficeHoursDeps) {
  return {
    async getTemplate(psychologistId: string): Promise<TemplateRecord[]> {
      return deps.findTemplateByPsychologist(psychologistId);
    },

    async upsertTemplateDay(
      psychologistId: string,
      dayOfWeek: number,
      body: { intervals?: unknown; notes?: unknown },
    ): Promise<TemplateRecord> {
      assertDayOfWeek(dayOfWeek);
      const intervals = parseAndValidateIntervals(body.intervals);
      const notes =
        typeof body.notes === "string" && body.notes.trim().length > 0
          ? body.notes.trim()
          : null;
      return deps.upsertTemplateDay({ psychologistId, dayOfWeek, intervals, notes });
    },

    async getOverrides(
      psychologistId: string,
      from: string,
      to: string,
    ): Promise<OverrideRecord[]> {
      assertDate(from, "from");
      assertDate(to, "to");
      if (from > to) throw new ValidationError("from must be <= to");
      return deps.findOverridesByRange(psychologistId, from, to);
    },

    async upsertOverrideDay(
      psychologistId: string,
      date: string,
      body: { intervals?: unknown; notes?: unknown },
    ): Promise<OverrideRecord> {
      assertDate(date);
      const intervals = parseAndValidateIntervals(body.intervals);
      const notes =
        typeof body.notes === "string" && body.notes.trim().length > 0
          ? body.notes.trim()
          : null;
      return deps.upsertOverrideDay({ psychologistId, date, intervals, notes });
    },

    async deleteOverrideDay(psychologistId: string, date: string): Promise<void> {
      assertDate(date);
      const ok = await deps.deleteOverrideDay(psychologistId, date);
      if (!ok) throw new NotFoundError("Override not found");
    },

    async resolveForDate(
      callerId: string,
      callerRole: "student" | "psychologist" | "admin",
      psychologistId: string,
      date: string,
    ): Promise<ResolverOutput> {
      assertDate(date);

      if (callerRole === "psychologist") {
        if (callerId !== psychologistId) {
          throw new ForbiddenError("Psychologists can only resolve own office hours");
        }
      } else if (callerRole === "student") {
        const link = await deps.findStudentPsychologistLink(callerId);
        if (!link || link.psychologistId !== psychologistId) {
          throw new ForbiddenError("Students can only resolve their linked psychologist");
        }
      }
      // admin: без ограничений

      const template = await deps.findTemplateByPsychologist(psychologistId);
      const overrides = await deps.findOverridesByRange(psychologistId, date, date);

      return resolveOfficeHours({ template, overrides, date });
    },

    async infoBlockForStudent(studentId: string, now: Date = new Date()): Promise<InfoBlock> {
      const link = await deps.findStudentPsychologistLink(studentId);
      if (!link) throw new NotFoundError("No psychologist assigned");

      const today = currentDay(now);
      const tomorrow = nextDay(today);

      const [template, overridesRange] = await Promise.all([
        deps.findTemplateByPsychologist(link.psychologistId),
        deps.findOverridesByRange(link.psychologistId, today, tomorrow),
      ]);

      const todayResolved = resolveOfficeHours({ template, overrides: overridesRange, date: today });
      const tomorrowResolved = resolveOfficeHours({
        template,
        overrides: overridesRange,
        date: tomorrow,
      });

      const todayEntry: DayEntry | null =
        todayResolved.intervals.length || todayResolved.notes
          ? { date: today, intervals: todayResolved.intervals, notes: todayResolved.notes }
          : null;
      const tomorrowEntry: DayEntry | null =
        tomorrowResolved.intervals.length || tomorrowResolved.notes
          ? { date: tomorrow, intervals: tomorrowResolved.intervals, notes: tomorrowResolved.notes }
          : null;

      return infoBlockFor(now, todayEntry, tomorrowEntry);
    },
  };
}
