import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { officeHours, studentPsychologist } from "../../db/schema.js";
import type { Interval } from "../../lib/office-hours/availability.js";

export type OfficeHoursRow = {
  id: string;
  psychologistId: string;
  date: string;
  intervals: Interval[];
  notes: string | null;
  updatedAt: Date;
};

function castRow(row: typeof officeHours.$inferSelect): OfficeHoursRow {
  return {
    id: row.id,
    psychologistId: row.psychologistId,
    date: row.date,
    intervals: (row.intervals as Interval[]) ?? [],
    notes: row.notes ?? null,
    updatedAt: row.updatedAt,
  };
}

export const officeHoursRepository = {
  async findByDate(psychologistId: string, date: string): Promise<OfficeHoursRow | null> {
    const [row] = await db
      .select()
      .from(officeHours)
      .where(and(eq(officeHours.psychologistId, psychologistId), eq(officeHours.date, date)))
      .limit(1);
    return row ? castRow(row) : null;
  },

  async findRange(
    psychologistId: string,
    from: string,
    to: string,
  ): Promise<OfficeHoursRow[]> {
    const rows = await db
      .select()
      .from(officeHours)
      .where(
        and(
          eq(officeHours.psychologistId, psychologistId),
          gte(officeHours.date, from),
          lte(officeHours.date, to),
        ),
      )
      .orderBy(asc(officeHours.date));
    return rows.map(castRow);
  },

  async upsertDay(data: {
    id: string;
    psychologistId: string;
    date: string;
    intervals: Interval[];
    notes: string | null;
  }): Promise<OfficeHoursRow> {
    const [row] = await db
      .insert(officeHours)
      .values({
        id: data.id,
        psychologistId: data.psychologistId,
        date: data.date,
        intervals: data.intervals,
        notes: data.notes,
      })
      .onConflictDoUpdate({
        target: [officeHours.psychologistId, officeHours.date],
        set: {
          intervals: data.intervals,
          notes: data.notes,
          updatedAt: new Date(),
        },
      })
      .returning();
    return castRow(row!);
  },

  async findStudentPsychologistLink(studentId: string) {
    const [link] = await db
      .select()
      .from(studentPsychologist)
      .where(eq(studentPsychologist.studentId, studentId))
      .limit(1);
    return link ?? null;
  },
};
