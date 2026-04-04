import { apiFetch } from "./client.js";
import type { StudentOverview, User, MoodEntry, DiagnosticSession, PaginatedResponse } from "@tirek/shared";

export interface StudentsFilters {
  search?: string;
  grade?: number;
  classLetter?: string;
  status?: string;
}

export interface StudentDetail {
  student: User;
  status: "normal" | "attention" | "crisis";
  moodHistory: MoodEntry[];
  testResults: (DiagnosticSession & { testSlug?: string; testName?: string })[];
}

export function getStudents(filters?: StudentsFilters) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.grade) params.set("grade", String(filters.grade));
  if (filters?.classLetter) params.set("classLetter", filters.classLetter);
  if (filters?.status) params.set("status", filters.status);
  params.set("limit", "100");
  const qs = params.toString();
  return apiFetch<PaginatedResponse<StudentOverview>>(`/psychologist/students${qs ? `?${qs}` : ""}`);
}

export function getStudent(id: string) {
  return apiFetch<StudentDetail>(`/psychologist/students/${id}`);
}
