import { eq, and, desc, or, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  diagnosticTests,
  diagnosticSessions,
  diagnosticAnswers,
  testAssignments,
  studentPsychologist,
} from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const diagnosticsRepository = {
  async findAllTests() {
    return db.select().from(diagnosticTests);
  },

  async findTestById(testId: string) {
    const [test] = await db
      .select()
      .from(diagnosticTests)
      .where(eq(diagnosticTests.id, testId))
      .limit(1);
    return test ?? null;
  },

  async findTestBySlug(slug: string) {
    const [test] = await db
      .select()
      .from(diagnosticTests)
      .where(eq(diagnosticTests.slug, slug))
      .limit(1);
    return test ?? null;
  },

  async findAssignmentsForStudent(
    userId: string,
    grade?: number | null,
    classLetter?: string | null,
  ) {
    const conditions = [
      eq(testAssignments.targetType, "student"),
      eq(testAssignments.targetStudentId, userId),
    ];

    const classConditions: ReturnType<typeof and>[] = [];
    if (grade !== undefined && grade !== null && classLetter) {
      classConditions.push(
        and(
          eq(testAssignments.targetType, "class"),
          eq(testAssignments.targetGrade, grade),
          eq(testAssignments.targetClassLetter, classLetter),
        ),
      );
    }

    const assignments = await db
      .select()
      .from(testAssignments)
      .where(
        classConditions.length > 0
          ? or(and(...conditions), ...classConditions)
          : and(...conditions),
      );

    return assignments;
  },

  async createSession(data: {
    id: string;
    userId: string;
    testId: string;
    assignmentId?: string | null;
  }) {
    const [session] = await db
      .insert(diagnosticSessions)
      .values({
        id: data.id,
        userId: data.userId,
        testId: data.testId,
        assignmentId: data.assignmentId ?? null,
      })
      .returning();
    return session;
  },

  async findSessionById(sessionId: string) {
    const [session] = await db
      .select()
      .from(diagnosticSessions)
      .where(eq(diagnosticSessions.id, sessionId))
      .limit(1);
    return session ?? null;
  },

  async createAnswer(data: {
    sessionId: string;
    questionIndex: number;
    answer: number;
    score: number;
  }) {
    const [answer] = await db
      .insert(diagnosticAnswers)
      .values(data)
      .returning();
    return answer;
  },

  async findAnswersBySession(sessionId: string) {
    return db
      .select()
      .from(diagnosticAnswers)
      .where(eq(diagnosticAnswers.sessionId, sessionId))
      .orderBy(diagnosticAnswers.questionIndex);
  },

  async completeSession(
    sessionId: string,
    data: {
      totalScore: number;
      maxScore: number;
      severity: string;
      completedAt: Date;
    },
  ) {
    const [session] = await db
      .update(diagnosticSessions)
      .set(data)
      .where(eq(diagnosticSessions.id, sessionId))
      .returning();
    return session ?? null;
  },

  async findSessionsByUser(userId: string, pagination: PaginationParams) {
    return db
      .select({
        session: diagnosticSessions,
        test: diagnosticTests,
      })
      .from(diagnosticSessions)
      .innerJoin(
        diagnosticTests,
        eq(diagnosticSessions.testId, diagnosticTests.id),
      )
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(diagnosticSessions.completedAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countSessionsByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(diagnosticSessions)
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findSessionsByPsychologist(psychologistId: string, pagination: PaginationParams, studentId?: string) {
    const conditions = [
      eq(studentPsychologist.psychologistId, psychologistId),
      sql`${diagnosticSessions.completedAt} IS NOT NULL`,
    ];
    if (studentId) {
      conditions.push(eq(diagnosticSessions.userId, studentId));
    }

    return db
      .select({
        session: diagnosticSessions,
        test: diagnosticTests,
      })
      .from(diagnosticSessions)
      .innerJoin(
        diagnosticTests,
        eq(diagnosticSessions.testId, diagnosticTests.id),
      )
      .innerJoin(
        studentPsychologist,
        eq(diagnosticSessions.userId, studentPsychologist.studentId),
      )
      .where(and(...conditions))
      .orderBy(desc(diagnosticSessions.completedAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countSessionsByPsychologist(psychologistId: string, studentId?: string) {
    const conditions = [
      eq(studentPsychologist.psychologistId, psychologistId),
      sql`${diagnosticSessions.completedAt} IS NOT NULL`,
    ];
    if (studentId) {
      conditions.push(eq(diagnosticSessions.userId, studentId));
    }

    const [row] = await db
      .select({ value: dbCount() })
      .from(diagnosticSessions)
      .innerJoin(
        studentPsychologist,
        eq(diagnosticSessions.userId, studentPsychologist.studentId),
      )
      .where(and(...conditions));
    return Number(row?.value ?? 0);
  },
};
