import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  moodEntries,
  diagnosticSessions,
  diagnosticTests,
} from "../../db/schema.js";
import type { StudentContextDeps } from "./student-context.js";

export const studentContextDeps: StudentContextDeps = {
  async loadStudentData(userId) {
    const [user] = await db
      .select({
        name: users.name,
        grade: users.grade,
        classLetter: users.classLetter,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { user: null, recentMoods: [], recentTests: [] };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoods = await db
      .select({
        mood: moodEntries.mood,
        stressLevel: moodEntries.stressLevel,
        sleepQuality: moodEntries.sleepQuality,
        createdAt: moodEntries.createdAt,
      })
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, sevenDaysAgo),
        ),
      )
      .orderBy(desc(moodEntries.createdAt))
      .limit(7);

    const recentTests = await db
      .select({
        testName: diagnosticTests.nameRu,
        completedAt: diagnosticSessions.completedAt,
      })
      .from(diagnosticSessions)
      .innerJoin(
        diagnosticTests,
        eq(diagnosticSessions.testId, diagnosticTests.id),
      )
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          gte(diagnosticSessions.startedAt, sevenDaysAgo),
        ),
      )
      .orderBy(desc(diagnosticSessions.completedAt))
      .limit(5);

    return { user, recentMoods, recentTests };
  },
};
