import { apiFetch } from "./client";
import type { AnalyticsOverview } from "@tirek/shared";

export interface ClassReportFilters {
  grade?: number;
  classLetter?: string;
}

export interface StudentReport {
  moodHistory: { date: string; mood: number }[];
  testResults: {
    id: string;
    testSlug: string;
    testName: string;
    completedAt: string;
    totalScore: number;
    maxScore: number;
    severity: string;
  }[];
  status: "normal" | "attention" | "crisis";
}

export interface ClassReport {
  totalStudents: number;
  averageMood: number | null;
  testCompletionRate: number;
  atRiskCount: number;
  moodDistribution: { happy: number; neutral: number; sad: number };
  riskDistribution: { normal: number; attention: number; crisis: number };
}

export const analyticsApi = {
  overview: () =>
    apiFetch<AnalyticsOverview>("/psychologist/analytics/overview"),

  studentReport: (id: string) =>
    apiFetch<StudentReport>(`/psychologist/analytics/students/${id}`),

  classReport: (filters?: ClassReportFilters) => {
    const params = new URLSearchParams();
    if (filters?.grade) params.set("grade", String(filters.grade));
    if (filters?.classLetter) params.set("classLetter", filters.classLetter);
    const qs = params.toString();
    return apiFetch<ClassReport>(
      `/psychologist/analytics/class${qs ? `?${qs}` : ""}`,
    );
  },
};
