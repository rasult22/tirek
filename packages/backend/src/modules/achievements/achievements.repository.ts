import { eq, and, desc, count as dbCount, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { achievements, userAchievements } from "../../db/schema.js";

export const achievementsRepository = {
  async findAll() {
    return db
      .select()
      .from(achievements)
      .orderBy(achievements.sortOrder);
  },

  async findBySlug(slug: string) {
    const [row] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.slug, slug))
      .limit(1);
    return row ?? null;
  },

  async findUserAchievements(userId: string) {
    return db
      .select({
        achievement: achievements,
        earnedAt: userAchievements.earnedAt,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(userAchievements.achievementId, achievements.id),
          eq(userAchievements.userId, userId),
        ),
      )
      .orderBy(achievements.sortOrder);
  },

  async hasAchievement(userId: string, achievementId: string) {
    const [row] = await db
      .select({ id: userAchievements.id })
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId),
        ),
      )
      .limit(1);
    return !!row;
  },

  async award(id: string, userId: string, achievementId: string) {
    const rows = await db
      .insert(userAchievements)
      .values({ id, userId, achievementId })
      .onConflictDoNothing()
      .returning();
    return rows;
  },

  async countUserAchievements(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    return Number(row?.value ?? 0);
  },

  async recentUserAchievements(userId: string, limit: number) {
    return db
      .select({
        achievement: achievements,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt))
      .limit(limit);
  },
};
