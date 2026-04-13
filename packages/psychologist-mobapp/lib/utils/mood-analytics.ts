import type { MoodEntry, DiagnosticSession, CbtEntry } from "@tirek/shared";

export interface MoodTrendResult {
  trend: "improving" | "stable" | "declining";
  average: number;
  data: { date: string; mood: number }[];
}

export function calculateMoodTrend(
  entries: MoodEntry[],
  days: number = 14,
): MoodTrendResult {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filtered = entries
    .filter((e) => new Date(e.createdAt) >= cutoff)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  if (filtered.length === 0) {
    return { trend: "stable", average: 0, data: [] };
  }

  const byDay = new Map<string, number>();
  for (const entry of filtered) {
    const day = new Date(entry.createdAt).toISOString().slice(0, 10);
    byDay.set(day, entry.mood);
  }

  const data = Array.from(byDay.entries()).map(([date, mood]) => ({
    date,
    mood,
  }));
  const moods = data.map((d) => d.mood);
  const average = moods.reduce((sum, m) => sum + m, 0) / moods.length;

  if (moods.length < 3) {
    return { trend: "stable", average: Math.round(average * 10) / 10, data };
  }

  const mid = Math.floor(moods.length / 2);
  const firstHalf = moods.slice(0, mid);
  const secondHalf = moods.slice(mid);

  const avgFirst = firstHalf.reduce((s, m) => s + m, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, m) => s + m, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  let trend: "improving" | "stable" | "declining" = "stable";
  if (diff > 0.3) trend = "improving";
  else if (diff < -0.3) trend = "declining";

  return { trend, average: Math.round(average * 10) / 10, data };
}

export interface EngagementResult {
  level: "high" | "medium" | "low";
  activeDays: number;
  totalDays: number;
}

export function calculateEngagement(
  moodHistory: MoodEntry[],
  testResults: DiagnosticSession[],
  cbtEntries: CbtEntry[] | undefined,
  days: number = 14,
): EngagementResult {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const activeDates = new Set<string>();

  for (const entry of moodHistory) {
    if (new Date(entry.createdAt) >= cutoff) {
      activeDates.add(new Date(entry.createdAt).toISOString().slice(0, 10));
    }
  }

  for (const test of testResults) {
    const date = test.completedAt ?? test.startedAt;
    if (date && new Date(date) >= cutoff) {
      activeDates.add(new Date(date).toISOString().slice(0, 10));
    }
  }

  if (cbtEntries) {
    for (const entry of cbtEntries) {
      if (new Date(entry.createdAt) >= cutoff) {
        activeDates.add(new Date(entry.createdAt).toISOString().slice(0, 10));
      }
    }
  }

  const activeDays = activeDates.size;
  let level: "high" | "medium" | "low" = "low";
  if (activeDays >= 10) level = "high";
  else if (activeDays >= 5) level = "medium";

  return { level, activeDays, totalDays: days };
}

export function statusToRiskLevel(
  status: "normal" | "attention" | "crisis",
): "low" | "medium" | "high" {
  if (status === "crisis") return "high";
  if (status === "attention") return "medium";
  return "low";
}
