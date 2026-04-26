import { v4 as uuidv4 } from "uuid";
import { eq, and, count as dbCount, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  userStreaks,
  userPlants,
  achievements,
  userAchievements,
  notifications,
  moodEntries,
  exerciseCompletions,
  exercises,
  journalEntries,
  diagnosticSessions,
  diagnosticTests,
} from "../../db/schema.js";
import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import type { AchievementContext } from "../../lib/achievement-checker/achievement-checker.js";
import type {
  ProductiveActionDeps,
  Tx,
} from "./productive-action.service.js";

// Drizzle's tx handle exposes the same query API as `db`.
type DrizzleTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function asTx(tx: Tx): DrizzleTx {
  return tx as DrizzleTx;
}

export const productiveActionDeps: ProductiveActionDeps = {
  async getStreak(userId) {
    const [row] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActiveDate: row.lastActiveDate,
      freezesAvailable: row.freezesAvailable,
      freezeUsedDate: row.freezeUsedDate ?? null,
    };
  },

  async getPlant(userId) {
    const [row] = await db
      .select({ growthPoints: userPlants.growthPoints })
      .from(userPlants)
      .where(eq(userPlants.userId, userId))
      .limit(1);
    return row ?? null;
  },

  async upsertStreak(tx, userId, data) {
    await asTx(tx)
      .insert(userStreaks)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userStreaks.userId,
        set: { ...data, updatedAt: new Date() },
      });
  },

  async upsertPlant(tx, userId, data) {
    await asTx(tx)
      .insert(userPlants)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userPlants.userId,
        set: { ...data, updatedAt: new Date() },
      });
  },

  async loadAchievementContext(tx, userId, hint) {
    const t = asTx(tx);
    const [
      moodRow,
      exerciseRow,
      breathingRow,
      journalRow,
      completedSessionsRow,
      distinctTestsRow,
      totalTestsRow,
    ] = await Promise.all([
      t.select({ value: dbCount() }).from(moodEntries).where(eq(moodEntries.userId, userId)),
      t
        .select({ value: dbCount() })
        .from(exerciseCompletions)
        .where(eq(exerciseCompletions.userId, userId)),
      t
        .select({ value: dbCount() })
        .from(exerciseCompletions)
        .innerJoin(exercises, eq(exercises.id, exerciseCompletions.exerciseId))
        .where(
          and(
            eq(exerciseCompletions.userId, userId),
            eq(exercises.type, "breathing"),
          ),
        ),
      t.select({ value: dbCount() }).from(journalEntries).where(eq(journalEntries.userId, userId)),
      t
        .select({ value: dbCount() })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, userId),
            isNotNull(diagnosticSessions.completedAt),
          ),
        ),
      t
        .select({ value: sql<number>`count(distinct ${diagnosticSessions.testId})` })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, userId),
            isNotNull(diagnosticSessions.completedAt),
          ),
        ),
      t.select({ value: dbCount() }).from(diagnosticTests),
    ]);

    const ctx: AchievementContext = {
      moodCount: Number(moodRow[0]?.value ?? 0),
      exerciseCount: Number(exerciseRow[0]?.value ?? 0),
      breathingExerciseCount: Number(breathingRow[0]?.value ?? 0),
      journalCount: Number(journalRow[0]?.value ?? 0),
      completedTestSessionsCount: Number(completedSessionsRow[0]?.value ?? 0),
      distinctCompletedTestsCount: Number(distinctTestsRow[0]?.value ?? 0),
      totalTestsCount: Number(totalTestsRow[0]?.value ?? 0),
      currentStreak: hint.currentStreak,
      plantStage: hint.plantStage,
    };
    return ctx;
  },

  async hasAchievement(tx, userId, slug) {
    const t = asTx(tx);
    const [row] = await t
      .select({ id: userAchievements.id })
      .from(userAchievements)
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(achievements.slug, slug),
        ),
      )
      .limit(1);
    return !!row;
  },

  async awardAchievement(tx, userId, slug) {
    const t = asTx(tx);
    const [achievement] = await t
      .select()
      .from(achievements)
      .where(eq(achievements.slug, slug))
      .limit(1);
    if (!achievement) return false;

    const inserted = await t
      .insert(userAchievements)
      .values({ id: uuidv4(), userId, achievementId: achievement.id })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) return false;

    // Notification rolls back together with the award if anything later in tx fails.
    await t.insert(notifications).values({
      id: uuidv4(),
      userId,
      type: "achievement",
      title: `${achievement.emoji} ${achievement.nameRu}`,
      body: achievement.descriptionRu,
      metadata: {
        achievementSlug: achievement.slug,
        emoji: achievement.emoji,
      },
    });

    return true;
  },

  async withTransaction(fn) {
    return db.transaction(async (tx) => fn(tx));
  },

  currentDay: () => currentDay(),
};
