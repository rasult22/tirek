import { v4 as uuidv4 } from "uuid";
import { eq, and, count as dbCount, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  moodEntries,
  exerciseCompletions,
  exercises,
  journalEntries,
  diagnosticSessions,
  diagnosticTests,
} from "../../db/schema.js";
import { achievementsRepository } from "./achievements.repository.js";
import { notificationsRepository } from "../notifications/notifications.repository.js";
import {
  getCandidateSlugs,
  isConditionMet,
  type AchievementContext,
  type AchievementTrigger,
} from "../../lib/achievement-checker/achievement-checker.js";

export interface AchievementCheckInput {
  trigger: AchievementTrigger;
  exerciseType?: string;
  currentStreak?: number;
  plantStage?: number;
}

// Собирает counts из БД для всех slugs данного trigger.
// Делает только нужные запросы — каждый slug редко требует все счётчики.
async function buildContext(
  userId: string,
  input: AchievementCheckInput,
): Promise<AchievementContext> {
  const [
    moodRow,
    exerciseRow,
    breathingRow,
    journalRow,
    completedSessionsRow,
    distinctTestsRow,
    totalTestsRow,
  ] = await Promise.all([
    db.select({ value: dbCount() }).from(moodEntries).where(eq(moodEntries.userId, userId)),
    db
      .select({ value: dbCount() })
      .from(exerciseCompletions)
      .where(eq(exerciseCompletions.userId, userId)),
    db
      .select({ value: dbCount() })
      .from(exerciseCompletions)
      .innerJoin(exercises, eq(exercises.id, exerciseCompletions.exerciseId))
      .where(
        and(eq(exerciseCompletions.userId, userId), eq(exercises.type, "breathing")),
      ),
    db
      .select({ value: dbCount() })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId)),
    db
      .select({ value: dbCount() })
      .from(diagnosticSessions)
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          isNotNull(diagnosticSessions.completedAt),
        ),
      ),
    db
      .select({ value: sql<number>`count(distinct ${diagnosticSessions.testId})` })
      .from(diagnosticSessions)
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          isNotNull(diagnosticSessions.completedAt),
        ),
      ),
    db.select({ value: dbCount() }).from(diagnosticTests),
  ]);

  return {
    moodCount: Number(moodRow[0]?.value ?? 0),
    exerciseCount: Number(exerciseRow[0]?.value ?? 0),
    breathingExerciseCount: Number(breathingRow[0]?.value ?? 0),
    journalCount: Number(journalRow[0]?.value ?? 0),
    completedTestSessionsCount: Number(completedSessionsRow[0]?.value ?? 0),
    distinctCompletedTestsCount: Number(distinctTestsRow[0]?.value ?? 0),
    totalTestsCount: Number(totalTestsRow[0]?.value ?? 0),
    currentStreak: input.currentStreak ?? 0,
    plantStage: ((input.plantStage ?? 1) as 1 | 2 | 3 | 4),
  };
}

export const achievementsService = {
  async getUserAchievements(userId: string) {
    const rows = await achievementsRepository.findUserAchievements(userId);
    const all = await achievementsRepository.findAll();
    const totalCount = all.length;
    let earnedCount = 0;

    const items = rows.map((r) => {
      const earned = !!r.earnedAt;
      if (earned) earnedCount++;
      return {
        achievement: {
          id: r.achievement.id,
          slug: r.achievement.slug,
          category: r.achievement.category,
          nameRu: r.achievement.nameRu,
          nameKz: r.achievement.nameKz,
          descriptionRu: r.achievement.descriptionRu,
          descriptionKz: r.achievement.descriptionKz,
          emoji: r.achievement.emoji,
          sortOrder: r.achievement.sortOrder,
        },
        earned,
        earnedAt: r.earnedAt?.toISOString() ?? null,
      };
    });

    return { achievements: items, earnedCount, totalCount };
  },

  async getUserSummary(userId: string) {
    const [all, earnedCount, recent] = await Promise.all([
      achievementsRepository.findAll(),
      achievementsRepository.countUserAchievements(userId),
      achievementsRepository.recentUserAchievements(userId, 3),
    ]);

    return {
      earnedCount,
      totalCount: all.length,
      recentAchievements: recent.map((r) => ({
        achievement: {
          id: r.achievement.id,
          slug: r.achievement.slug,
          category: r.achievement.category,
          nameRu: r.achievement.nameRu,
          nameKz: r.achievement.nameKz,
          descriptionRu: r.achievement.descriptionRu,
          descriptionKz: r.achievement.descriptionKz,
          emoji: r.achievement.emoji,
          sortOrder: r.achievement.sortOrder,
        },
        earned: true,
        earnedAt: r.earnedAt.toISOString(),
      })),
    };
  },

  async checkAndAward(userId: string, input: AchievementCheckInput) {
    const slugsToCheck = getCandidateSlugs(input.trigger);
    if (slugsToCheck.length === 0) return;

    const ctx = await buildContext(userId, input);

    for (const slug of slugsToCheck) {
      const achievement = await achievementsRepository.findBySlug(slug);
      if (!achievement) continue;

      const already = await achievementsRepository.hasAchievement(
        userId,
        achievement.id,
      );
      if (already) continue;

      if (!isConditionMet(slug, ctx)) continue;

      const rows = await achievementsRepository.award(
        uuidv4(),
        userId,
        achievement.id,
      );

      // Only create notification if actually awarded (not a conflict)
      if (rows.length > 0) {
        notificationsRepository
          .create({
            id: uuidv4(),
            userId,
            type: "achievement",
            title: `${achievement.emoji} ${achievement.nameRu}`,
            body: achievement.descriptionRu,
            metadata: {
              achievementSlug: achievement.slug,
              emoji: achievement.emoji,
            },
          })
          .catch(() => {});
      }
    }
  },
};
