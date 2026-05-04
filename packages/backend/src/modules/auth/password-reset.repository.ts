import { and, eq, gt, gte, isNull, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { passwordResetCodes, users } from "../../db/schema.js";

export const passwordResetRepository = {
  async invalidateActiveCodesForUser(userId: string, when: Date) {
    await db
      .update(passwordResetCodes)
      .set({ usedAt: when })
      .where(
        and(
          eq(passwordResetCodes.userId, userId),
          isNull(passwordResetCodes.usedAt),
        ),
      );
  },

  async countRecentCodesForUser(userId: string, since: Date) {
    const [row] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, userId),
          gte(passwordResetCodes.createdAt, since),
        ),
      );
    return row?.count ?? 0;
  },

  async findLatestCodeForUser(userId: string) {
    const [row] = await db
      .select()
      .from(passwordResetCodes)
      .where(eq(passwordResetCodes.userId, userId))
      .orderBy(desc(passwordResetCodes.createdAt))
      .limit(1);
    return row ?? null;
  },

  async findActiveCodeForUser(userId: string, when: Date) {
    const [row] = await db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, userId),
          isNull(passwordResetCodes.usedAt),
          gt(passwordResetCodes.expiresAt, when),
        ),
      )
      .orderBy(desc(passwordResetCodes.createdAt))
      .limit(1);
    return row ?? null;
  },

  async insertCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    const [row] = await db
      .insert(passwordResetCodes)
      .values(data)
      .returning();
    return row;
  },

  async incrementAttempts(codeId: string) {
    const [row] = await db
      .update(passwordResetCodes)
      .set({ attempts: sql`${passwordResetCodes.attempts} + 1` })
      .where(eq(passwordResetCodes.id, codeId))
      .returning();
    return row ?? null;
  },

  async markCodeUsed(codeId: string, when: Date) {
    await db
      .update(passwordResetCodes)
      .set({ usedAt: when })
      .where(eq(passwordResetCodes.id, codeId));
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },
};
