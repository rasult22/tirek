import { eq, and, desc, isNull, or, sql, count as dbCount } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { sosEvents, studentPsychologist, users } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

const resolverUser = alias(users, "resolver");

const sosWithStudent = {
  id: sosEvents.id,
  userId: sosEvents.userId,
  type: sosEvents.type,
  level: sosEvents.level,
  createdAt: sosEvents.createdAt,
  resolvedAt: sosEvents.resolvedAt,
  resolvedBy: sosEvents.resolvedBy,
  notes: sosEvents.notes,
  contactedStudent: sosEvents.contactedStudent,
  contactedParent: sosEvents.contactedParent,
  documented: sosEvents.documented,
  studentName: users.name,
  studentGrade: users.grade,
  studentClassLetter: users.classLetter,
};

export const sosRepository = {
  async create(data: {
    id: string;
    userId: string;
    type: "breathing" | "hotline" | "chat" | "urgent";
    createdAt: Date;
  }) {
    const [event] = await db
      .insert(sosEvents)
      .values({
        id: data.id,
        userId: data.userId,
        type: data.type,
        createdAt: data.createdAt,
      })
      .returning();
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
          // Only urgent (or legacy rows with NULL type) belong in the active
          // crisis feed — breathing/hotline/chat are silent history (issue #11).
          or(eq(sosEvents.type, "urgent"), isNull(sosEvents.type)),
        ),
      )
      .orderBy(
        // Priority: derive from `type` (issue #11), fall back to legacy `level`.
        sql`COALESCE(
          CASE ${sosEvents.type}
            WHEN 'urgent' THEN 3
            WHEN 'chat' THEN 2
            WHEN 'hotline' THEN 1
            WHEN 'breathing' THEN 0
          END,
          ${sosEvents.level}
        ) DESC NULLS LAST`,
        desc(sosEvents.createdAt),
      )
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
          or(eq(sosEvents.type, "urgent"), isNull(sosEvents.type)),
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
    data: {
      resolvedBy: string;
      notes?: string | null;
      contactedStudent?: boolean;
      contactedParent?: boolean;
      documented?: boolean;
    },
  ) {
    const [event] = await db
      .update(sosEvents)
      .set({
        resolvedAt: sql`NOW()`,
        resolvedBy: data.resolvedBy,
        notes: data.notes ?? null,
        contactedStudent: data.contactedStudent ?? false,
        contactedParent: data.contactedParent ?? false,
        documented: data.documented ?? false,
      })
      .where(eq(sosEvents.id, id))
      .returning();
    return event;
  },

  async findHistory(psychologistId: string, pagination: PaginationParams) {
    return db
      .select({
        ...sosWithStudent,
        resolvedByName: resolverUser.name,
      })
      .from(sosEvents)
      .innerJoin(
        studentPsychologist,
        eq(sosEvents.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(sosEvents.userId, users.id))
      .leftJoin(resolverUser, eq(sosEvents.resolvedBy, resolverUser.id))
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
