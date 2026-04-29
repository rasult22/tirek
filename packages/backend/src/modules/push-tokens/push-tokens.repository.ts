import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { pushTokens } from "../../db/schema.js";
import type { Platform, PushTokenRecord } from "./push-tokens.factory.js";

function cast(row: typeof pushTokens.$inferSelect): PushTokenRecord {
  return {
    token: row.token,
    userId: row.userId,
    platform: row.platform as Platform,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
  };
}

export const pushTokensRepository = {
  async upsert(input: {
    token: string;
    userId: string;
    platform: Platform;
    now: Date;
  }): Promise<PushTokenRecord> {
    const [row] = await db
      .insert(pushTokens)
      .values({
        token: input.token,
        userId: input.userId,
        platform: input.platform,
        createdAt: input.now,
        lastSeenAt: input.now,
      })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: {
          userId: input.userId,
          platform: input.platform,
          lastSeenAt: input.now,
        },
      })
      .returning();
    return cast(row!);
  },

  async findByUserId(userId: string): Promise<PushTokenRecord[]> {
    const rows = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
    return rows.map(cast);
  },

  async deleteByToken(token: string): Promise<boolean> {
    const result = await db
      .delete(pushTokens)
      .where(eq(pushTokens.token, token))
      .returning({ token: pushTokens.token });
    return result.length > 0;
  },
};
