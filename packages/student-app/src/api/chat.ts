import { apiFetch } from "./client.js";
import type { ChatSession, ChatMessage, PaginatedResponse } from "@tirek/shared";
import { useAuthStore } from "../store/auth-store.js";

export const chatApi = {
  sessions: () => apiFetch<PaginatedResponse<ChatSession>>("/student/chat/sessions?limit=6"),

  create: () =>
    apiFetch<ChatSession>("/student/chat/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  messages: (sessionId: string) =>
    apiFetch<PaginatedResponse<ChatMessage>>(`/student/chat/sessions/${sessionId}/messages?limit=100`),

  send: (sessionId: string, content: string) =>
    apiFetch<ChatMessage>(`/student/chat/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  /** SSE streaming endpoint — returns EventSource-compatible reader */
  streamMessage: (sessionId: string, content: string) => {
    const token = useAuthStore.getState().token;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    return fetch(`${baseUrl}/student/chat/sessions/${sessionId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    });
  },
};
