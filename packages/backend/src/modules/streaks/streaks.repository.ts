import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { userStreaks } from "../../db/schema.js";

export const streaksRepository = {
  async getByUserId(userId: string) {
    const [row] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);
    return row ?? null;
  },

  async upsert(
    userId: string,
    data: {
      currentStreak: number;
      longestStreak: number;
      lastActiveDate: string;
      freezesAvailable: number;
      freezeUsedDate?: string | null;
    },
  ) {
    const [row] = await db
      .insert(userStreaks)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userStreaks.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  },
};
