import { apiFetch } from "./client.js";
import type { AssignedTest, DiagnosticTest, DiagnosticSession, PaginatedResponse } from "@tirek/shared";

export interface SuggestedAction {
  type: "exercise" | "journal" | "chat" | "hotline";
  textKey: string;
  deeplink: string;
}

export interface CompletionResult {
  completed: true;
  sessionId: string;
  requiresSupport: boolean;
  suggestedActions: SuggestedAction[];
}

export interface SessionResult {
  sessionId: string;
  testId: string;
  testName: string | null;
  completedAt: string | null;
  requiresSupport: boolean;
  suggestedActions: SuggestedAction[];
}

export const testsApi = {
  list: () => apiFetch<DiagnosticTest[]>("/student/tests/"),

  assigned: () => apiFetch<AssignedTest[]>("/student/tests/assigned"),

  start: (testId: string) =>
    apiFetch<DiagnosticSession>(`/student/tests/${testId}/start`, { method: "POST" }),

  answer: (sessionId: string, data: { questionIndex: number; answer: number }) =>
    apiFetch<{ ok: boolean }>(`/student/tests/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  complete: (sessionId: string) =>
    apiFetch<CompletionResult>(`/student/tests/sessions/${sessionId}/complete`, { method: "POST" }),

  session: (sessionId: string) =>
    apiFetch<SessionResult>(`/student/tests/sessions/${sessionId}`),

  history: () => apiFetch<PaginatedResponse<SessionResult>>("/student/tests/history"),
};
