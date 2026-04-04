import { eq, desc, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { journalEntries } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const journalRepository = {
  async create(data: { id: string; userId: string; prompt?: string; content: string }) {
    const [entry] = await db.insert(journalEntries).values(data).returning();
    return entry;
  },

  async findByUser(userId: string, pagination: PaginationParams) {
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));
    return Number(row?.value ?? 0);
  },

  async findById(id: string) {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id))
      .limit(1);
    return entry ?? null;
  },

  async deleteById(id: string) {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  },
};
