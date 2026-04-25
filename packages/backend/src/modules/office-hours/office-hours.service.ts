import { v4 as uuidv4 } from "uuid";
import { officeHoursRepository, type OfficeHoursRow } from "./office-hours.repository.js";
import { validate as validateIntervals } from "../../lib/office-hours/intervals.js";
import {
  infoBlockFor,
  type DayEntry,
  type InfoBlock,
  type Interval,
} from "../../lib/office-hours/availability.js";
import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import { NotFoundError, ValidationError } from "../../shared/errors.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string, field = "date"): void {
  if (!DATE_RE.test(value)) {
    throw new ValidationError(`Invalid ${field} format, expected YYYY-MM-DD`);
  }
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

function toDayEntry(row: OfficeHoursRow | null): DayEntry | null {
  if (!row) return null;
  return { date: row.date, intervals: row.intervals, notes: row.notes };
}

export const officeHoursService = {
  async getByDate(psychologistId: string, date: string): Promise<OfficeHoursRow | null> {
    assertDate(date);
    return officeHoursRepository.findByDate(psychologistId, date);
  },

  async getRange(
    psychologistId: string,
    from: string,
    to: string,
  ): Promise<OfficeHoursRow[]> {
    assertDate(from, "from");
    assertDate(to, "to");
    if (from > to) throw new ValidationError("from must be <= to");
    return officeHoursRepository.findRange(psychologistId, from, to);
  },

  async upsertDay(
    psychologistId: string,
    body: { date?: unknown; intervals?: unknown; notes?: unknown },
  ): Promise<OfficeHoursRow> {
    if (typeof body.date !== "string") throw new ValidationError("date is required");
    assertDate(body.date);

    if (!Array.isArray(body.intervals)) {
      throw new ValidationError("intervals must be an array");
    }
    for (const entry of body.intervals) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        typeof (entry as { start?: unknown }).start !== "string" ||
        typeof (entry as { end?: unknown }).end !== "string"
      ) {
        throw new ValidationError("each interval must be { start: HH:mm, end: HH:mm }");
      }
    }
    const intervals = body.intervals as Interval[];

    const result = validateIntervals(intervals);
    if (!result.ok) throw new ValidationError(result.reason);

    const notes =
      typeof body.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim()
        : null;

    return officeHoursRepository.upsertDay({
      id: uuidv4(),
      psychologistId,
      date: body.date,
      intervals,
      notes,
    });
  },

  async infoBlockForStudent(studentId: string, now: Date = new Date()): Promise<InfoBlock> {
    const link = await officeHoursRepository.findStudentPsychologistLink(studentId);
    if (!link) throw new NotFoundError("No psychologist assigned");

    const today = currentDay(now);
    const tomorrow = nextDay(today);
    const [todayRow, tomorrowRow] = await Promise.all([
      officeHoursRepository.findByDate(link.psychologistId, today),
      officeHoursRepository.findByDate(link.psychologistId, tomorrow),
    ]);

    return infoBlockFor(now, toDayEntry(todayRow), toDayEntry(tomorrowRow));
  },
};
