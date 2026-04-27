import { eq, and, sql, gte, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  studentPsychologist,
  moodEntries,
  diagnosticSessions,
  diagnosticTests,
  users,
} from "../../db/schema.js";

export const analyticsRepository = {
  async getStudentMoodTrend(studentId: string, days: number) {
    return db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, studentId),
          gte(
            moodEntries.createdAt,
            sql`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
          ),
        ),
      )
      .orderBy(moodEntries.createdAt);
  },

  async getStudentTestResults(studentId: string) {
    return db
      .select({
        id: diagnosticSessions.id,
        testId: diagnosticSessions.testId,
        testSlug: diagnosticTests.slug,
        testName: diagnosticTests.nameRu,
        startedAt: diagnosticSessions.startedAt,
        completedAt: diagnosticSessions.completedAt,
        totalScore: diagnosticSessions.totalScore,
        maxScore: diagnosticSessions.maxScore,
        severity: diagnosticSessions.severity,
        flaggedItems: diagnosticSessions.flaggedItems,
      })
      .from(diagnosticSessions)
      .innerJoin(
        diagnosticTests,
        eq(diagnosticSessions.testId, diagnosticTests.id),
      )
      .where(
        and(
          eq(diagnosticSessions.userId, studentId),
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(diagnosticSessions.completedAt);
  },

  async getClassRawData(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ) {
    const conditions = [
      eq(studentPsychologist.psychologistId, psychologistId),
    ];
    if (grade !== undefined) {
      conditions.push(eq(users.grade, grade) as any);
    }
    if (classLetter !== undefined) {
      conditions.push(eq(users.classLetter, classLetter) as any);
    }

    const [totalRow] = await db
      .select({ value: count() })
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .where(and(...conditions));

    const moodRows = await db
      .select({ mood: moodEntries.mood, factors: moodEntries.factors })
      .from(moodEntries)
      .innerJoin(
        studentPsychologist,
        eq(moodEntries.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(moodEntries.userId, users.id))
      .where(
        and(
          ...conditions,
          gte(moodEntries.createdAt, sql`NOW() - INTERVAL '7 days'`),
        ),
      );

    const sessionRows = await db
      .select({
        severity: diagnosticSessions.severity,
        completedAt: diagnosticSessions.completedAt,
      })
      .from(diagnosticSessions)
      .innerJoin(
        studentPsychologist,
        eq(diagnosticSessions.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(diagnosticSessions.userId, users.id))
      .where(
        and(
          ...conditions,
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
        ),
      );

    return {
      totalStudents: totalRow?.value ?? 0,
      entries: moodRows.map((r) => ({
        mood: r.mood,
        factors: (r.factors as string[] | null) ?? null,
      })),
      sessions: sessionRows.map((r) => ({
        severity: r.severity as 'low' | 'moderate' | 'high' | null,
        completedAt: r.completedAt,
      })),
    };
  },
};
