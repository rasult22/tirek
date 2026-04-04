import { eq, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { contentQuotes } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const contentRepository = {
  async findAll(pagination: PaginationParams, category?: string) {
    const query = category
      ? db.select().from(contentQuotes).where(eq(contentQuotes.category, category))
      : db.select().from(contentQuotes);

    return query.limit(pagination.limit).offset(pagination.offset);
  },

  async countAll(category?: string) {
    const [result] = category
      ? await db.select({ value: dbCount() }).from(contentQuotes).where(eq(contentQuotes.category, category))
      : await db.select({ value: dbCount() }).from(contentQuotes);
    return Number(result?.value ?? 0);
  },

  async findById(id: number) {
    const [quote] = await db
      .select()
      .from(contentQuotes)
      .where(eq(contentQuotes.id, id))
      .limit(1);
    return quote ?? null;
  },

  async findByOffset(offset: number) {
    const [quote] = await db
      .select()
      .from(contentQuotes)
      .limit(1)
      .offset(offset);
    return quote ?? null;
  },
};
