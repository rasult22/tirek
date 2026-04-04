import { apiFetch } from "./client.js";
import type { Severity, PaginatedResponse } from "@tirek/shared";

export interface DiagnosticsFilters {
  testSlug?: string;
  severity?: string;
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

export function getResults(filters?: DiagnosticsFilters) {
  const params = new URLSearchParams();
  if (filters?.testSlug) params.set("testSlug", filters.testSlug);
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.grade) params.set("grade", String(filters.grade));
  if (filters?.classLetter) params.set("classLetter", filters.classLetter);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  params.set("limit", "100");
  const qs = params.toString();
  return apiFetch<PaginatedResponse<DiagnosticResultRow>>(`/psychologist/diagnostics/results${qs ? `?${qs}` : ""}`);
}

export interface AssignTestData {
  testSlug: string;
  target: "student" | "class";
  studentId?: string;
  grade?: number;
  classLetter?: string;
  dueDate?: string;
}

export function assignTest(data: AssignTestData) {
  return apiFetch<{ success: boolean }>("/psychologist/diagnostics/assign", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
