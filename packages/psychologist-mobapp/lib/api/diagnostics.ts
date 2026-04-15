import { apiFetch } from "./client";
import type {
  Severity,
  PaginatedResponse,
  DiagnosticAiReport,
  SessionAnswersResponse,
} from "@tirek/shared";

export interface DiagnosticsFilters {
  testSlug?: string;
  severity?: Severity;
  grade?: number;
  classLetter?: string;
  from?: string;
  to?: string;
}

export interface DiagnosticResultRow {
  sessionId: string;
  studentId: string;
  testId: string;
  testName: string | null;
  completedAt: string | null;
  totalScore: number | null;
  maxScore: number | null;
  severity: Severity | null;
  studentName?: string;
  studentGrade?: number;
  studentClass?: string;
  testSlug?: string;
}

export interface AssignTestData {
  testSlug: string;
  target: "student" | "class";
  studentId?: string;
  grade?: number;
  classLetter?: string;
  dueDate?: string;
}

export const diagnosticsApi = {
  getResults: (filters?: DiagnosticsFilters) => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (filters?.testSlug) params.set("testSlug", filters.testSlug);
    if (filters?.severity) params.set("severity", filters.severity);
    if (filters?.grade) params.set("grade", String(filters.grade));
    if (filters?.classLetter) params.set("classLetter", filters.classLetter);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const qs = params.toString();
    return apiFetch<PaginatedResponse<DiagnosticResultRow>>(
      `/psychologist/diagnostics/results${qs ? `?${qs}` : ""}`,
    );
  },

  assignTest: (data: AssignTestData) =>
    apiFetch<{ success: boolean }>("/psychologist/diagnostics/assign", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getReport: (sessionId: string) =>
    apiFetch<DiagnosticAiReport | { status: "pending" }>(
      `/psychologist/diagnostics/sessions/${sessionId}/report`,
    ),

  regenerateReport: (sessionId: string) =>
    apiFetch<{ status: "pending" }>(
      `/psychologist/diagnostics/sessions/${sessionId}/report/regenerate`,
      { method: "POST" },
    ),

  getSessionAnswers: (sessionId: string) =>
    apiFetch<SessionAnswersResponse>(
      `/psychologist/diagnostics/sessions/${sessionId}/answers`,
    ),
};
