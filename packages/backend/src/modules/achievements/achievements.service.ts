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
  achievements,
} from "../../db/schema.js";
import { achievementsRepository } from "./achievements.repository.js";
import { notificationsRepository } from "../notifications/notifications.repository.js";

// ── Achievement context type ────────────────────────────────────────
export interface AchievementContext {
  trigger: "mood" | "exercise" | "journal" | "test" | "streak" | "plant";
  exerciseType?: string;
  currentStreak?: number;
  plantStage?: number;
}

// ── Trigger → slugs mapping ──────��──────────────────────────────────
const TRIGGER_SLUGS: Record<string, string[]> = {
  mood: ["first-mood", "mood-expert"],
  exercise: ["first-exercise", "breathing-master", "exercise-master"],
  journal: ["first-journal", "journal-keeper"],
  test: ["first-test", "test-explorer", "all-tests"],
  streak: ["streak-3", "streak-7", "streak-30"],
  plant: ["plant-sprout", "plant-tree", "plant-bloom"],
};

// ── Condition checkers ──────────────────────────────────────────────
async function checkCondition(
  userId: string,
  slug: string,
  ctx: AchievementContext,
): Promise<boolean> {
  switch (slug) {
    case "first-mood": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId));
      return Number(r?.value ?? 0) >= 1;
    }
    case "first-exercise": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(exerciseCompletions)
        .where(eq(exerciseCompletions.userId, userId));
      return Number(r?.value ?? 0) >= 1;
    }
    case "first-journal": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId));
      return Number(r?.value ?? 0) >= 1;
    }
    case "first-test": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, userId),
            isNotNull(diagnosticSessions.completedAt),
          ),
        );
      return Number(r?.value ?? 0) >= 1;
    }
    case "streak-3":
      return (ctx.currentStreak ?? 0) >= 3;
    case "streak-7":
      return (ctx.currentStreak ?? 0) >= 7;
    case "streak-30":
      return (ctx.currentStreak ?? 0) >= 30;
    case "breathing-master": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(exerciseCompletions)
        .innerJoin(exercises, eq(exercises.id, exerciseCompletions.exerciseId))
        .where(
          and(
            eq(exerciseCompletions.userId, userId),
            eq(exercises.type, "breathing"),
          ),
        );
      return Number(r?.value ?? 0) >= 10;
    }
    case "exercise-master": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(exerciseCompletions)
        .where(eq(exerciseCompletions.userId, userId));
      return Number(r?.value ?? 0) >= 25;
    }
    case "mood-expert": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId));
      return Number(r?.value ?? 0) >= 30;
    }
    case "journal-keeper": {
      const [r] = await db
        .select({ value: dbCount() })
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId));
      return Number(r?.value ?? 0) >= 15;
    }
    case "test-explorer": {
      const [r] = await db
        .select({ value: sql<number>`count(distinct ${diagnosticSessions.testId})` })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, userId),
            isNotNull(diagnosticSessions.completedAt),
          ),
        );
      return Number(r?.value ?? 0) >= 3;
    }
    case "all-tests": {
      const [totalTests] = await db
        .select({ value: dbCount() })
        .from(diagnosticTests);
      const total = Number(totalTests?.value ?? 0);
      if (total === 0) return false;
      const [completed] = await db
        .select({ value: sql<number>`count(distinct ${diagnosticSessions.testId})` })
        .from(diagnosticSessions)
        .where(
          and(
            eq(diagnosticSessions.userId, userId),
            isNotNull(diagnosticSessions.completedAt),
          ),
        );
      return Number(completed?.value ?? 0) >= total;
    }
    case "plant-sprout":
      return (ctx.plantStage ?? 0) >= 2;
    case "plant-tree":
      return (ctx.plantStage ?? 0) >= 3;
    case "plant-bloom":
      return (ctx.plantStage ?? 0) >= 4;
    default:
      return false;
  }
}

// ── Service ───────────��─────────────────────��───────────────────────
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

  async checkAndAward(userId: string, ctx: AchievementContext) {
    const slugsToCheck = TRIGGER_SLUGS[ctx.trigger] ?? [];

    for (const slug of slugsToCheck) {
      const achievement = await achievementsRepository.findBySlug(slug);
      if (!achievement) continue;

      const already = await achievementsRepository.hasAchievement(
        userId,
        achievement.id,
      );
      if (already) continue;

      const met = await checkCondition(userId, slug, ctx);
      if (!met) continue;

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
