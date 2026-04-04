import { eq, desc, asc, sql, count as dbCount, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { chatSessions, chatMessages, users } from "../../db/schema.js";
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

  async findFlaggedMessages(studentIds: string[], pagination: PaginationParams) {
    if (studentIds.length === 0) return { rows: [], total: 0 };

    const rows = await db
      .select({
        messageId: chatMessages.id,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        sessionId: chatSessions.id,
        studentName: users.name,
        studentGrade: users.grade,
        studentClass: users.classLetter,
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .innerJoin(users, eq(chatSessions.userId, users.id))
      .where(eq(chatMessages.flagged, true))
      .orderBy(desc(chatMessages.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const [countRow] = await db
      .select({ value: dbCount() })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatMessages.flagged, true));

    return { rows, total: Number(countRow?.value ?? 0) };
  },
};
