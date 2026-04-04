import { eq, and, sql, gte, count, avg, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  studentPsychologist,
  moodEntries,
  testAssignments,
  sosEvents,
  diagnosticSessions,
  diagnosticTests,
  users,
} from "../../db/schema.js";

export const analyticsRepository = {
  async getOverview(psychologistId: string) {
    // Total students linked to this psychologist
    const [totalStudentsRow] = await db
      .select({ value: count() })
      .from(studentPsychologist)
      .where(eq(studentPsychologist.psychologistId, psychologistId));

    // Students with mood entries today
    const [activeTodayRow] = await db
      .select({ value: count(moodEntries.userId) })
      .from(moodEntries)
      .innerJoin(
        studentPsychologist,
        eq(moodEntries.userId, studentPsychologist.studentId),
      )
      .where(
        and(
          eq(studentPsychologist.psychologistId, psychologistId),
          sql`DATE(${moodEntries.createdAt}) = CURRENT_DATE`,
        ),
      );

    // Pending (unfinished) test assignments
    const [pendingTestsRow] = await db
      .select({ value: count() })
      .from(testAssignments)
      .where(
        and(
          eq(testAssignments.assignedBy, psychologistId),
          sql`NOT EXISTS (
            SELECT 1 FROM diagnostic_sessions ds
            WHERE ds.assignment_id = ${testAssignments.id}
            AND ds.completed_at IS NOT NULL
          )`,
        ),
      );

    // Active SOS events for linked students
    const [crisisAlertsRow] = await db
      .select({ value: count() })
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

    return {
      totalStudents: totalStudentsRow?.value ?? 0,
      activeToday: activeTodayRow?.value ?? 0,
      pendingTests: pendingTestsRow?.value ?? 0,
      crisisAlerts: crisisAlertsRow?.value ?? 0,
    };
  },

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
        sessionId: diagnosticSessions.id,
        testId: diagnosticSessions.testId,
        testName: diagnosticTests.nameRu,
        startedAt: diagnosticSessions.startedAt,
        completedAt: diagnosticSessions.completedAt,
        totalScore: diagnosticSessions.totalScore,
        maxScore: diagnosticSessions.maxScore,
        severity: diagnosticSessions.severity,
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

  async getClassStats(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ) {
    // Build conditions for filtering students
    const conditions = [
      eq(studentPsychologist.psychologistId, psychologistId),
    ];
    if (grade !== undefined) {
      conditions.push(eq(users.grade, grade) as any);
    }
    if (classLetter !== undefined) {
      conditions.push(eq(users.classLetter, classLetter) as any);
    }

    // Average mood for filtered students (last 7 days)
    const [avgMoodRow] = await db
      .select({ value: avg(moodEntries.mood) })
      .from(moodEntries)
      .innerJoin(
        studentPsychologist,
        eq(moodEntries.userId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(moodEntries.userId, users.id))
      .where(
        and(
          ...conditions,
          gte(
            moodEntries.createdAt,
            sql`NOW() - INTERVAL '7 days'`,
          ),
        ),
      );

    // Total students in this class
    const [totalRow] = await db
      .select({ value: count() })
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .where(and(...conditions));

    // Completed test sessions count
    const [completedTestsRow] = await db
      .select({ value: count() })
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

    // Risk distribution (severity counts from diagnostic_sessions)
    const riskDistribution = await db
      .select({
        severity: diagnosticSessions.severity,
        count: count(),
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
          sql`${diagnosticSessions.severity} IS NOT NULL`,
        ),
      )
      .groupBy(diagnosticSessions.severity);

    return {
      totalStudents: totalRow?.value ?? 0,
      averageMood: avgMoodRow?.value ? parseFloat(String(avgMoodRow.value)) : null,
      completedTests: completedTestsRow?.value ?? 0,
      riskDistribution: riskDistribution.reduce(
        (acc, row) => {
          if (row.severity) {
            acc[row.severity] = row.count;
          }
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  },
};
