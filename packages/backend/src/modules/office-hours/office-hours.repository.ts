import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  officeHoursTemplate,
  officeHoursOverride,
  studentPsychologist,
} from "../../db/schema.js";
import type { Interval } from "../../lib/office-hours/availability.js";
import type { DayOfWeek } from "../../lib/office-hours/resolver.js";
import type {
  OverrideRecord,
  StudentPsychologistLink,
  TemplateRecord,
} from "./office-hours.factory.js";

function castTemplate(row: typeof officeHoursTemplate.$inferSelect): TemplateRecord {
  return {
    id: row.id,
    psychologistId: row.psychologistId,
    dayOfWeek: row.dayOfWeek as DayOfWeek,
    intervals: (row.intervals as Interval[]) ?? [],
    notes: row.notes ?? null,
    updatedAt: row.updatedAt,
  };
}

function castOverride(row: typeof officeHoursOverride.$inferSelect): OverrideRecord {
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
  // ── Template ──────────────────────────────────────────────────────
  async findTemplateByPsychologist(psychologistId: string): Promise<TemplateRecord[]> {
    const rows = await db
      .select()
      .from(officeHoursTemplate)
      .where(eq(officeHoursTemplate.psychologistId, psychologistId))
      .orderBy(asc(officeHoursTemplate.dayOfWeek));
    return rows.map(castTemplate);
  },

  async upsertTemplateDay(data: {
    id: string;
    psychologistId: string;
    dayOfWeek: DayOfWeek;
    intervals: Interval[];
    notes: string | null;
  }): Promise<TemplateRecord> {
    const [row] = await db
      .insert(officeHoursTemplate)
      .values({
        id: data.id,
        psychologistId: data.psychologistId,
        dayOfWeek: data.dayOfWeek,
        intervals: data.intervals,
        notes: data.notes,
      })
      .onConflictDoUpdate({
        target: [officeHoursTemplate.psychologistId, officeHoursTemplate.dayOfWeek],
        set: {
          intervals: data.intervals,
          notes: data.notes,
          updatedAt: new Date(),
        },
      })
      .returning();
    return castTemplate(row!);
  },

  // ── Override ──────────────────────────────────────────────────────
  async findOverridesByRange(
    psychologistId: string,
    from: string,
    to: string,
  ): Promise<OverrideRecord[]> {
    const rows = await db
      .select()
      .from(officeHoursOverride)
      .where(
        and(
          eq(officeHoursOverride.psychologistId, psychologistId),
          gte(officeHoursOverride.date, from),
          lte(officeHoursOverride.date, to),
        ),
      )
      .orderBy(asc(officeHoursOverride.date));
    return rows.map(castOverride);
  },

  async upsertOverrideDay(data: {
    id: string;
    psychologistId: string;
    date: string;
    intervals: Interval[];
    notes: string | null;
  }): Promise<OverrideRecord> {
    const [row] = await db
      .insert(officeHoursOverride)
      .values({
        id: data.id,
        psychologistId: data.psychologistId,
        date: data.date,
        intervals: data.intervals,
        notes: data.notes,
      })
      .onConflictDoUpdate({
        target: [officeHoursOverride.psychologistId, officeHoursOverride.date],
        set: {
          intervals: data.intervals,
          notes: data.notes,
          updatedAt: new Date(),
        },
      })
      .returning();
    return castOverride(row!);
  },

  async deleteOverrideDay(psychologistId: string, date: string): Promise<boolean> {
    const result = await db
      .delete(officeHoursOverride)
      .where(
        and(
          eq(officeHoursOverride.psychologistId, psychologistId),
          eq(officeHoursOverride.date, date),
        ),
      )
      .returning({ id: officeHoursOverride.id });
    return result.length > 0;
  },

  // ── Student → psychologist link ────────────────────────────────────
  async findStudentPsychologistLink(
    studentId: string,
  ): Promise<StudentPsychologistLink | null> {
    const [link] = await db
      .select({
        studentId: studentPsychologist.studentId,
        psychologistId: studentPsychologist.psychologistId,
      })
      .from(studentPsychologist)
      .where(eq(studentPsychologist.studentId, studentId))
      .limit(1);
    return link ?? null;
  },
};
