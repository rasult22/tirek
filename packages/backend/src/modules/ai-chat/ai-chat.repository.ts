import { eq, desc, asc, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { chatSessions, chatMessages } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const aiChatRepository = {
  async createSession(data: { id: string; userId: string; mode: string }) {
    const [session] = await db.insert(chatSessions).values(data).returning();
    return session;
  },

  async findSessionById(id: string) {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id))
      .limit(1);
    return session ?? null;
  },

  async findSessionsByUser(userId: string, pagination: PaginationParams) {
    return db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.startedAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countSessionsByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));
    return Number(row?.value ?? 0);
  },

  async createMessage(data: {
    sessionId: string;
    role: string;
    content: string;
    flagged?: boolean;
  }) {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  },

  async findMessagesBySession(sessionId: string, pagination: PaginationParams) {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countMessagesBySession(sessionId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));
    return Number(row?.value ?? 0);
  },

  async updateSessionLastMessage(sessionId: string) {
    const [session] = await db
      .update(chatSessions)
      .set({ lastMessageAt: sql`NOW()` })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    return session;
  },
};
