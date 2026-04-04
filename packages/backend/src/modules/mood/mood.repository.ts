import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { moodEntries } from "../../db/schema.js";

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

  async findToday(userId: string) {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          sql`DATE(${moodEntries.createdAt}) = CURRENT_DATE`,
        ),
      )
      .limit(1);
    return entry ?? null;
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
    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(
            moodEntries.createdAt,
            sql`NOW() - INTERVAL '${sql.raw(String(days))} days'`,
          ),
        ),
      )
      .orderBy(desc(moodEntries.createdAt));
    return entries;
  },
};
