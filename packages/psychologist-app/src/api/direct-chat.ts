import { apiFetch } from "./client.js";
import type { Conversation, DirectMessage, PaginatedResponse } from "@tirek/shared";

export const directChatApi = {
  conversations: () =>
    apiFetch<PaginatedResponse<Conversation>>("/psychologist/direct-chat/conversations"),

  createConversation: (studentId: string) =>
    apiFetch<Conversation>("/psychologist/direct-chat/conversations", {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  messages: (conversationId: string) =>
    apiFetch<PaginatedResponse<DirectMessage>>(
      `/psychologist/direct-chat/conversations/${conversationId}/messages?limit=100`,
    ),

  send: (conversationId: string, content: string) =>
    apiFetch<DirectMessage>(
      `/psychologist/direct-chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    ),

  markRead: (conversationId: string) =>
    apiFetch<{ ok: boolean }>(
      `/psychologist/direct-chat/conversations/${conversationId}/read`,
      { method: "PATCH" },
    ),

  unreadCount: () =>
    apiFetch<{ count: number }>("/psychologist/direct-chat/unread-count"),
};
