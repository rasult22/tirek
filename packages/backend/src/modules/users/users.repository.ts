import { eq, and, count as dbCount, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, studentPsychologist } from "../../db/schema.js";
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
