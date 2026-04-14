import { apiFetch } from "./client.js";
import type { AssignedTest, DiagnosticTest, DiagnosticSession, Severity, PaginatedResponse } from "@tirek/shared";

export interface SessionResult {
  sessionId: string;
  testId: string;
  testName: string | null;
  totalScore: number | null;
  maxScore: number | null;
  severity: Severity | null;
  message: string | null;
  completedAt: string | null;
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
    apiFetch<DiagnosticSession>(`/student/tests/sessions/${sessionId}/complete`, { method: "POST" }),

  session: (sessionId: string) =>
    apiFetch<SessionResult>(`/student/tests/sessions/${sessionId}`),

  history: () => apiFetch<PaginatedResponse<SessionResult>>("/student/tests/history"),
};
