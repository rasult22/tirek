import { analyticsRepository } from "./analytics.repository.js";

export const analyticsService = {
  async getOverview(psychologistId: string) {
    return analyticsRepository.getOverview(psychologistId);
  },

  async getStudentReport(psychologistId: string, studentId: string) {
    const [moodTrend, testResults] = await Promise.all([
      analyticsRepository.getStudentMoodTrend(studentId, 30),
      analyticsRepository.getStudentTestResults(studentId),
    ]);

    // Determine status
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
    const stats = await analyticsRepository.getClassStats(
      psychologistId,
      grade,
      classLetter,
    );

    const moodDistribution = await analyticsRepository.getMoodDistribution(
      psychologistId,
      grade,
      classLetter,
    );

    // Map severity keys: low->normal, moderate->attention, high->crisis
    const riskDistribution = {
      normal: stats.riskDistribution["low"] ?? 0,
      attention: stats.riskDistribution["moderate"] ?? 0,
      crisis: stats.riskDistribution["high"] ?? 0,
    };

    const totalStudents = stats.totalStudents;
    const testCompletionRate = totalStudents > 0
      ? stats.completedTests / totalStudents
      : 0;

    const atRiskCount = riskDistribution.attention + riskDistribution.crisis;

    return {
      totalStudents,
      averageMood: stats.averageMood,
      testCompletionRate,
      atRiskCount,
      moodDistribution,
      riskDistribution,
    };
  },
};
