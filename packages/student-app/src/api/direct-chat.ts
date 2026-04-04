import { apiFetch } from "./client.js";
import type { Conversation, DirectMessage, PaginatedResponse } from "@tirek/shared";

export const directChatApi = {
  conversations: () =>
    apiFetch<PaginatedResponse<Conversation>>("/student/direct-chat/conversations"),

  createConversation: (psychologistId: string) =>
    apiFetch<Conversation>("/student/direct-chat/conversations", {
      method: "POST",
      body: JSON.stringify({ psychologistId }),
    }),

  messages: (conversationId: string) =>
    apiFetch<PaginatedResponse<DirectMessage>>(
      `/student/direct-chat/conversations/${conversationId}/messages?limit=100`,
    ),

  send: (conversationId: string, content: string) =>
    apiFetch<DirectMessage>(
      `/student/direct-chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    ),

  markRead: (conversationId: string) =>
    apiFetch<{ ok: boolean }>(
      `/student/direct-chat/conversations/${conversationId}/read`,
      { method: "PATCH" },
    ),

  unreadCount: () =>
    apiFetch<{ count: number }>("/student/direct-chat/unread-count"),

  myPsychologist: () =>
    apiFetch<{ id: string; name: string; avatarId: string | null }>(
      "/student/direct-chat/my-psychologist",
    ),
};
