import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { moodEntries } from "../../db/schema.js";
import { startOfDay, endOfDay, currentDay } from "../../lib/almaty-day/almaty-day.js";

export const moodRepository = {
  async create(data: {
    id: string;
    userId: string;
    mood: number;
    energy?: number | null;
    sleepQuality?: number | null;
    stressLevel?: number | null;
    note?: string | null;
    factors?: unknown;
  }) {
    const [entry] = await db.insert(moodEntries).values(data).returning();
    return entry;
  },

  async findInAlmatyDay(userId: string, day: string = currentDay()) {
    return db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, startOfDay(day)),
          lte(moodEntries.createdAt, endOfDay(day)),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));
  },

  async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, startDate),
          lte(moodEntries.createdAt, endDate),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));
    return entries;
  },

  async findRecent(userId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.createdAt, since),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));
    return entries;
  },
};
