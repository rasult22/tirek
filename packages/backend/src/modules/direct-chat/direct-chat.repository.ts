import {
  eq,
  and,
  or,
  ne,
  desc,
  asc,
  sql,
  isNull,
  count as dbCount,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  conversations,
  directMessages,
  users,
  studentPsychologist,
} from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const directChatRepository = {
  async findConversationById(id: string) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return conv ?? null;
  },

  async findConversationByPair(studentId: string, psychologistId: string) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.studentId, studentId),
          eq(conversations.psychologistId, psychologistId),
        ),
      )
      .limit(1);
    return conv ?? null;
  },

  async findOrCreateConversation(data: {
    id: string;
    studentId: string;
    psychologistId: string;
  }) {
    // Try to insert, ignore conflict on unique pair
    await db
      .insert(conversations)
      .values(data)
      .onConflictDoNothing();

    // Always select to return the existing or newly created row
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.studentId, data.studentId),
          eq(conversations.psychologistId, data.psychologistId),
        ),
      )
      .limit(1);
    return conv!;
  },

  async findConversationsByStudent(
    studentId: string,
    pagination: PaginationParams,
  ) {
    // issue #113: conversations с soft-deleted психологом не показываем ученику.
    return db
      .select({
        id: conversations.id,
        studentId: conversations.studentId,
        psychologistId: conversations.psychologistId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        otherUserId: users.id,
        otherUserName: users.name,
        otherUserAvatarId: users.avatarId,
      })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.psychologistId))
      .where(
        and(
          eq(conversations.studentId, studentId),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countConversationsByStudent(studentId: string) {
    // issue #113: считаем только conversations, где психолог не удалён.
    const [row] = await db
      .select({ value: dbCount() })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.psychologistId))
      .where(
        and(
          eq(conversations.studentId, studentId),
          isNull(users.deletedAt),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findConversationsByPsychologist(
    psychologistId: string,
    pagination: PaginationParams,
  ) {
    return db
      .select({
        id: conversations.id,
        studentId: conversations.studentId,
        psychologistId: conversations.psychologistId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        otherUserId: users.id,
        otherUserName: users.name,
        otherUserAvatarId: users.avatarId,
        otherUserGrade: users.grade,
        otherUserClassLetter: users.classLetter,
      })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.studentId))
      .where(eq(conversations.psychologistId, psychologistId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countConversationsByPsychologist(psychologistId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(conversations)
      .where(eq(conversations.psychologistId, psychologistId));
    return Number(row?.value ?? 0);
  },

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    const [message] = await db
      .insert(directMessages)
      .values(data)
      .returning();
    return message;
  },

  async findMessagesByConversation(
    conversationId: string,
    pagination: PaginationParams,
  ) {
    return db
      .select()
      .from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(asc(directMessages.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countMessagesByConversation(conversationId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(directMessages)
      .where(eq(directMessages.conversationId, conversationId));
    return Number(row?.value ?? 0);
  },

  async markMessagesAsRead(conversationId: string, readerId: string) {
    await db
      .update(directMessages)
      .set({ readAt: sql`NOW()` })
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          ne(directMessages.senderId, readerId),
          isNull(directMessages.readAt),
        ),
      );
  },

  async countUnreadByUser(userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(directMessages)
      .innerJoin(
        conversations,
        eq(directMessages.conversationId, conversations.id),
      )
      .where(
        and(
          or(
            eq(conversations.studentId, userId),
            eq(conversations.psychologistId, userId),
          ),
          ne(directMessages.senderId, userId),
          isNull(directMessages.readAt),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async updateConversationLastMessage(conversationId: string) {
    await db
      .update(conversations)
      .set({ lastMessageAt: sql`NOW()` })
      .where(eq(conversations.id, conversationId));
  },

  async getLastMessage(conversationId: string) {
    const [msg] = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(desc(directMessages.createdAt))
      .limit(1);
    return msg ?? null;
  },

  async countUnreadInConversation(conversationId: string, userId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          ne(directMessages.senderId, userId),
          isNull(directMessages.readAt),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findStudentPsychologistLink(studentId: string, psychologistId: string) {
    const [link] = await db
      .select()
      .from(studentPsychologist)
      .where(
        and(
          eq(studentPsychologist.studentId, studentId),
          eq(studentPsychologist.psychologistId, psychologistId),
        ),
      )
      .limit(1);
    return link ?? null;
  },

  async findLinkedPsychologist(studentId: string) {
    // issue #113: deleted (soft) психолог не должен показываться ученику.
    const [link] = await db
      .select({
        psychologistId: studentPsychologist.psychologistId,
        name: users.name,
        avatarId: users.avatarId,
      })
      .from(studentPsychologist)
      .innerJoin(users, eq(users.id, studentPsychologist.psychologistId))
      .where(
        and(
          eq(studentPsychologist.studentId, studentId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return link ?? null;
  },
};
