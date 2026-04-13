import { apiFetch } from "./client";
import type { MoodEntry, MoodCalendarDay, MoodInsights } from "@tirek/shared";

export const moodApi = {
  create: (data: {
    mood: number;
    energy?: number | null;
    sleepQuality?: number | null;
    stressLevel?: number | null;
    note?: string | null;
    factors?: string[] | null;
  }) =>
    apiFetch<MoodEntry>("/student/mood", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  today: () => apiFetch<MoodEntry | null>("/student/mood/today"),

  calendar: (year: number, month: number) =>
    apiFetch<MoodCalendarDay[]>(
      `/student/mood/calendar?year=${year}&month=${month}`,
    ),

  insights: () => apiFetch<MoodInsights>("/student/mood/insights"),
};
