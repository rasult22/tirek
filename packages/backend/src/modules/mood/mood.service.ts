import { v4 as uuidv4 } from "uuid";
import { ValidationError, ConflictError } from "../../shared/errors.js";
import { moodRepository } from "./mood.repository.js";
import { streaksService } from "../streaks/streaks.service.js";
import { virtualPlantService } from "../virtual-plant/virtual-plant.service.js";
import { achievementsService } from "../achievements/achievements.service.js";

export const moodService = {
  async createEntry(
    userId: string,
    body: {
      mood?: number;
      energy?: number;
      sleepQuality?: number;
      stressLevel?: number;
      note?: string;
      factors?: string[];
    },
  ) {
    const { mood, energy, sleepQuality, stressLevel, note, factors } = body;

    if (mood === undefined || mood === null) {
      throw new ValidationError("Mood is required");
    }
    if (mood < 1 || mood > 5 || !Number.isInteger(mood)) {
      throw new ValidationError("Mood must be an integer between 1 and 5");
    }

    const existing = await moodRepository.findToday(userId);
    if (existing) {
      throw new ConflictError("Mood entry already exists for today");
    }

    const entry = await moodRepository.create({
      id: uuidv4(),
      userId,
      mood,
      energy: energy ?? null,
      sleepQuality: sleepQuality ?? null,
      stressLevel: stressLevel ?? null,
      note: note ?? null,
      factors: factors ?? null,
    });

    // Record streak activity (fire-and-forget)
    streaksService.recordActivity(userId).catch(() => {});
    virtualPlantService.addPoints(userId, 10).catch(() => {});
    achievementsService.checkAndAward(userId, { trigger: "mood" }).catch(() => {});

    return entry;
  },

  async getToday(userId: string) {
    const entry = await moodRepository.findToday(userId);
    return entry;
  },

  async getCalendar(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const entries = await moodRepository.findByDateRange(
      userId,
      startDate,
      endDate,
    );

    return entries.map((e) => ({
      date: e.createdAt.toISOString().split("T")[0],
      mood: e.mood,
    }));
  },

  async getInsights(userId: string) {
    const entries = await moodRepository.findRecent(userId, 14);

    if (entries.length === 0) {
      return {
        weeklyAverage: null,
        trend: "neutral" as const,
        topFactors: [],
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    const thisWeek = entries.filter((e) => e.createdAt >= sevenDaysAgo);
    const lastWeek = entries.filter(
      (e) => e.createdAt >= fourteenDaysAgo && e.createdAt < sevenDaysAgo,
    );

    const avg = (arr: typeof entries) =>
      arr.length > 0
        ? arr.reduce((sum, e) => sum + e.mood, 0) / arr.length
        : 0;

    const thisWeekAvg = avg(thisWeek);
    const lastWeekAvg = avg(lastWeek);

    let trend: "improving" | "declining" | "stable" = "stable";
    if (lastWeek.length > 0 && thisWeek.length > 0) {
      const diff = thisWeekAvg - lastWeekAvg;
      if (diff > 0.3) trend = "improving";
      else if (diff < -0.3) trend = "declining";
    }

    // Count factor occurrences
    const factorCounts: Record<string, number> = {};
    for (const entry of entries) {
      const factors = entry.factors as string[] | null;
      if (Array.isArray(factors)) {
        for (const f of factors) {
          factorCounts[f] = (factorCounts[f] || 0) + 1;
        }
      }
    }

    const topFactors = Object.entries(factorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    return {
      weeklyAverage: Math.round(thisWeekAvg * 100) / 100,
      trend,
      topFactors,
    };
  },
};
