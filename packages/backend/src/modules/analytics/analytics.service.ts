import { analyticsRepository } from "./analytics.repository.js";
import { computeClassStats } from "../../lib/analytics-aggregator/analytics-aggregator.js";
import {
  calculateRiskStatus,
  toRiskSession,
  type TestSessionForRisk,
} from "../../lib/risk-status-calculator/risk-status-calculator.js";

export const analyticsService = {
  async getStudentReport(psychologistId: string, studentId: string) {
    const [moodTrend, testResults] = await Promise.all([
      analyticsRepository.getStudentMoodTrend(studentId, 30),
      analyticsRepository.getStudentTestResults(studentId),
    ]);

    const riskSessions = testResults
      .map(toRiskSession)
      .filter((s): s is TestSessionForRisk => s !== null);
    const { status, reason } = calculateRiskStatus(riskSessions);

    return {
      studentId,
      status,
      reason,
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
