import { eq, and, desc, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { normalizeNotificationType } from "./notification-type.js";

export const notificationsRepository = {
  async findByUser(userId: string, pagination: PaginationParams) {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
    return rows.map((row) => ({
      ...row,
      type: normalizeNotificationType(row.type),
    }));
  },

  async countByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return Number(row?.value ?? 0);
  },

  async countUnread(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async markRead(id: string, userId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
        ),
      )
      .returning();
    return notification ?? null;
  },

  async create(data: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    metadata?: unknown;
  }) {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  },
};
