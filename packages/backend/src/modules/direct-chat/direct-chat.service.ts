import { v4 as uuidv4 } from "uuid";
import { directChatRepository } from "./direct-chat.repository.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors.js";
import {
  paginated,
  type PaginationParams,
} from "../../shared/pagination.js";

async function verifyAccess(conversationId: string, userId: string) {
  const conv = await directChatRepository.findConversationById(conversationId);
  if (!conv) throw new NotFoundError("Conversation not found");
  if (conv.studentId !== userId && conv.psychologistId !== userId) {
    throw new ForbiddenError("Access denied to this conversation");
  }
  return conv;
}

export const directChatService = {
  async getOrCreateConversation(
    userId: string,
    role: string,
    targetUserId: string,
  ) {
    const studentId = role === "student" ? userId : targetUserId;
    const psychologistId = role === "student" ? targetUserId : userId;

    // Verify link exists
    const link = await directChatRepository.findStudentPsychologistLink(
      studentId,
      psychologistId,
    );
    if (!link) throw new ForbiddenError("Not linked to this user");

    const conv = await directChatRepository.findOrCreateConversation({
      id: uuidv4(),
      studentId,
      psychologistId,
    });

    return conv;
  },

  async getConversations(
    userId: string,
    role: string,
    pagination: PaginationParams,
  ) {
    const isStudent = role === "student";
    const rows = isStudent
      ? await directChatRepository.findConversationsByStudent(userId, pagination)
      : await directChatRepository.findConversationsByPsychologist(userId, pagination);
    const total = isStudent
      ? await directChatRepository.countConversationsByStudent(userId)
      : await directChatRepository.countConversationsByPsychologist(userId);

    // Enrich with last message and unread count
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const [lastMsg, unreadCount] = await Promise.all([
          directChatRepository.getLastMessage(row.id),
          directChatRepository.countUnreadInConversation(row.id, userId),
        ]);

        return {
          id: row.id,
          studentId: row.studentId,
          psychologistId: row.psychologistId,
          lastMessageAt: row.lastMessageAt,
          createdAt: row.createdAt,
          otherUser: {
            id: row.otherUserId,
            name: row.otherUserName,
            avatarId: row.otherUserAvatarId,
          },
          lastMessage: lastMsg
            ? {
                content:
                  lastMsg.content.length > 100
                    ? lastMsg.content.slice(0, 100) + "…"
                    : lastMsg.content,
                createdAt: lastMsg.createdAt,
                senderId: lastMsg.senderId,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return paginated(enriched, total, pagination);
  },

  async getMessages(
    userId: string,
    conversationId: string,
    pagination: PaginationParams,
  ) {
    await verifyAccess(conversationId, userId);

    const [rows, total] = await Promise.all([
      directChatRepository.findMessagesByConversation(
        conversationId,
        pagination,
      ),
      directChatRepository.countMessagesByConversation(conversationId),
    ]);

    return paginated(rows, total, pagination);
  },

  async sendMessage(
    userId: string,
    role: string,
    conversationId: string,
    body: { content: string },
  ) {
    if (!body.content?.trim()) {
      throw new ValidationError("Message content is required");
    }

    await verifyAccess(conversationId, userId);

    const message = await directChatRepository.createMessage({
      conversationId,
      senderId: userId,
      content: body.content.trim(),
    });

    await directChatRepository.updateConversationLastMessage(conversationId);

    return message;
  },

  async markAsRead(userId: string, conversationId: string) {
    await verifyAccess(conversationId, userId);
    await directChatRepository.markMessagesAsRead(conversationId, userId);
  },

  async getUnreadCount(userId: string) {
    const count = await directChatRepository.countUnreadByUser(userId);
    return { count };
  },

  async getMyPsychologist(studentId: string) {
    const psych =
      await directChatRepository.findLinkedPsychologist(studentId);
    if (!psych) throw new NotFoundError("No psychologist assigned");
    return {
      id: psych.psychologistId,
      name: psych.name,
      avatarId: psych.avatarId,
    };
  },
};
