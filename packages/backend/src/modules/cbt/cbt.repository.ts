import { eq, and, desc, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cbtEntries } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const cbtRepository = {
  async create(data: {
    id: string;
    userId: string;
    type: string;
    data: Record<string, unknown>;
  }) {
    const [entry] = await db.insert(cbtEntries).values(data).returning();
    return entry;
  },

  async findByUser(userId: string, pagination: PaginationParams, type?: string) {
    const conditions = [eq(cbtEntries.userId, userId)];
    if (type) conditions.push(eq(cbtEntries.type, type));

    return db
      .select()
      .from(cbtEntries)
      .where(and(...conditions))
      .orderBy(desc(cbtEntries.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countByUser(userId: string, type?: string) {
    const conditions = [eq(cbtEntries.userId, userId)];
    if (type) conditions.push(eq(cbtEntries.type, type));

    const [row] = await db
      .select({ value: dbCount() })
      .from(cbtEntries)
      .where(and(...conditions));
    return Number(row?.value ?? 0);
  },

  async findById(id: string) {
    const [entry] = await db
      .select()
      .from(cbtEntries)
      .where(eq(cbtEntries.id, id))
      .limit(1);
    return entry ?? null;
  },

  async update(id: string, data: Record<string, unknown>) {
    const [entry] = await db
      .update(cbtEntries)
      .set({ data })
      .where(eq(cbtEntries.id, id))
      .returning();
    return entry;
  },

  async deleteById(id: string) {
    await db.delete(cbtEntries).where(eq(cbtEntries.id, id));
  },
};
