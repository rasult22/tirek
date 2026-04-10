import { eq, and, desc, isNull, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sosEvents, studentPsychologist, users } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

const sosWithStudent = {
  id: sosEvents.id,
  userId: sosEvents.userId,
  level: sosEvents.level,
  createdAt: sosEvents.createdAt,
  resolvedAt: sosEvents.resolvedAt,
  resolvedBy: sosEvents.resolvedBy,
  notes: sosEvents.notes,
  studentName: users.name,
  studentGrade: users.grade,
  studentClassLetter: users.classLetter,
};

export const sosRepository = {
  async create(data: { id: string; userId: string; level: number }) {
    const [event] = await db.insert(sosEvents).values(data).returning();
    return event;
  },

  async findActiveByPsychologist(psychologistId: string, pagination: PaginationParams) {
    return db
      .select(sosWithStudent)
      .from(sosEvents)
      .innerJoin(
        studentPsychologist,
        eq(sosEvents.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(sosEvents.userId, users.id))
      .where(
        and(
          eq(studentPsychologist.psychologistId, psychologistId),
          isNull(sosEvents.resolvedAt),
        ),
      )
      .orderBy(desc(sosEvents.level), desc(sosEvents.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countActiveByPsychologist(psychologistId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(sosEvents)
      .innerJoin(
        studentPsychologist,
        eq(sosEvents.userId, studentPsychologist.studentId),
      )
      .where(
        and(
          eq(studentPsychologist.psychologistId, psychologistId),
          isNull(sosEvents.resolvedAt),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findById(id: string) {
    const [event] = await db
      .select()
      .from(sosEvents)
      .where(eq(sosEvents.id, id))
      .limit(1);
    return event ?? null;
  },

  async resolve(
    id: string,
    data: { resolvedBy: string; notes?: string | null },
  ) {
    const [event] = await db
      .update(sosEvents)
      .set({
        resolvedAt: sql`NOW()`,
        resolvedBy: data.resolvedBy,
        notes: data.notes ?? null,
      })
      .where(eq(sosEvents.id, id))
      .returning();
    return event;
  },

  async findHistory(psychologistId: string, pagination: PaginationParams) {
    return db
      .select(sosWithStudent)
      .from(sosEvents)
      .innerJoin(
        studentPsychologist,
        eq(sosEvents.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(sosEvents.userId, users.id))
      .where(eq(studentPsychologist.psychologistId, psychologistId))
      .orderBy(desc(sosEvents.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countHistory(psychologistId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(sosEvents)
      .innerJoin(
        studentPsychologist,
        eq(sosEvents.userId, studentPsychologist.studentId),
      )
      .where(eq(studentPsychologist.psychologistId, psychologistId));
    return Number(row?.value ?? 0);
  },
};
