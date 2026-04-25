import { analyticsRepository } from "./analytics.repository.js";
import { computeClassStats } from "../../lib/analytics-aggregator/analytics-aggregator.js";

export const analyticsService = {
  async getOverview(psychologistId: string) {
    return analyticsRepository.getOverview(psychologistId);
  },

  async getStudentReport(psychologistId: string, studentId: string) {
    const [moodTrend, testResults] = await Promise.all([
      analyticsRepository.getStudentMoodTrend(studentId, 30),
      analyticsRepository.getStudentTestResults(studentId),
    ]);

    let status: "normal" | "attention" | "crisis" = "normal";
    const hasHigh = testResults.some((r) => r.severity === "high");
    const hasModerate = testResults.some((r) => r.severity === "moderate");
    if (hasHigh) status = "crisis";
    else if (hasModerate) status = "attention";

    return {
      studentId,
      status,
      moodHistory: moodTrend.map((e) => ({
        date: new Date(e.createdAt).toISOString().split("T")[0],
        mood: e.mood,
      })),
      testResults,
    };
  },

  async getClassReport(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ) {
    const raw = await analyticsRepository.getClassRawData(
      psychologistId,
      grade,
      classLetter,
    );

    const stats = computeClassStats({
      entries: raw.entries,
      sessions: raw.sessions,
      totalStudents: raw.totalStudents,
    });

    return {
      totalStudents: raw.totalStudents,
      averageMood: stats.averageMood,
      testCompletionRate: stats.testCompletionRate,
      atRiskCount: stats.atRiskCount,
      moodDistribution: stats.moodDistribution,
      riskDistribution: stats.riskDistribution,
    };
  },
};
