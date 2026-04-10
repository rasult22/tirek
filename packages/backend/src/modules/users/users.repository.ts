import { eq, and, count as dbCount, sql, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  studentPsychologist,
  conversations,
  directMessages,
  psychologistNotes,
} from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

const studentColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  language: users.language,
  avatarId: users.avatarId,
  grade: users.grade,
  classLetter: users.classLetter,
  createdAt: users.createdAt,
  assignedAt: studentPsychologist.assignedAt,
};

export const usersRepository = {
  async detachStudent(studentId: string, psychologistId: string) {
    // 1. Find direct chat conversations between this pair
    const convs = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.studentId, studentId),
          eq(conversations.psychologistId, psychologistId),
        ),
      );
    const convIds = convs.map((c) => c.id);

    // 2. Delete direct messages in those conversations
    if (convIds.length > 0) {
      await db
        .delete(directMessages)
        .where(inArray(directMessages.conversationId, convIds));
    }

    // 3. Delete the conversations themselves
    if (convIds.length > 0) {
      await db
        .delete(conversations)
        .where(inArray(conversations.id, convIds));
    }

    // 4. Delete psychologist notes about this student
    await db
      .delete(psychologistNotes)
      .where(
        and(
          eq(psychologistNotes.studentId, studentId),
          eq(psychologistNotes.psychologistId, psychologistId),
        ),
      );

    // 5. Delete the student-psychologist link
    const result = await db
      .delete(studentPsychologist)
      .where(
        and(
          eq(studentPsychologist.studentId, studentId),
          eq(studentPsychologist.psychologistId, psychologistId),
        ),
      )
      .returning();
    return result.length > 0;
  },

  async findStudentsByPsychologist(
    psychologistId: string,
    pagination: PaginationParams,
    filters?: { grade?: number; classLetter?: string },
  ) {
    const conditions = [eq(studentPsychologist.psychologistId, psychologistId)];
    if (filters?.grade) conditions.push(eq(users.grade, filters.grade));
    if (filters?.classLetter) conditions.push(eq(users.classLetter, filters.classLetter));

    return db
      .select(studentColumns)
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .where(and(...conditions))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countStudentsByPsychologist(
    psychologistId: string,
    filters?: { grade?: number; classLetter?: string },
  ) {
    const conditions = [eq(studentPsychologist.psychologistId, psychologistId)];
    if (filters?.grade) conditions.push(eq(users.grade, filters.grade));
    if (filters?.classLetter) conditions.push(eq(users.classLetter, filters.classLetter));

    const [row] = await db
      .select({ value: dbCount() })
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .where(and(...conditions));
    return Number(row?.value ?? 0);
  },

  async findStudentById(studentId: string, psychologistId: string) {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        language: users.language,
        avatarId: users.avatarId,
        grade: users.grade,
        classLetter: users.classLetter,
        createdAt: users.createdAt,
        assignedAt: studentPsychologist.assignedAt,
      })
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .where(
        and(
          eq(studentPsychologist.studentId, studentId),
          eq(studentPsychologist.psychologistId, psychologistId),
        ),
      )
      .limit(1);
    return row ?? null;
  },
};
