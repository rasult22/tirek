import { v4 as uuidv4 } from "uuid";
import { ValidationError } from "../../shared/errors.js";
import { moodRepository } from "./mood.repository.js";
import { latestPerSlot, groupByAlmatyDay } from "./mood-slots.js";
import { streaksService } from "../streaks/streaks.service.js";
import { virtualPlantService } from "../virtual-plant/virtual-plant.service.js";
import { achievementsService } from "../achievements/achievements.service.js";
import { currentDay, startOfDay, endOfDay } from "../../lib/almaty-day/almaty-day.js";

// Единый порог тренда mood/insights — здесь и нигде больше.
const TREND_THRESHOLD = 0.3;

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

    const existingToday = await moodRepository.findInAlmatyDay(userId);
    const isFirstProductiveActionForToday = existingToday.length === 0;

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

    if (isFirstProductiveActionForToday) {
      streaksService.recordActivity(userId).catch(() => {});
      virtualPlantService.addPoints(userId, 10).catch(() => {});
      achievementsService.checkAndAward(userId, { trigger: "mood" }).catch(() => {});
    }

    return entry;
  },

  async getToday(userId: string) {
    const entries = await moodRepository.findInAlmatyDay(userId);
    return latestPerSlot(entries);
  },

  async getCalendar(userId: string, year: number, month: number) {
    const startDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    const startDate = startOfDay(startDay);
    const endDate = endOfDay(endDayStr);

    const entries = await moodRepository.findByDateRange(userId, startDate, endDate);
    const grouped = groupByAlmatyDay(entries);

    return Object.entries(grouped).map(([date, slots]) => ({
      date,
      daySlotMood: slots.daySlot?.mood ?? null,
      eveningSlotMood: slots.eveningSlot?.mood ?? null,
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

    const today = currentDay();
    const todayStart = startOfDay(today);
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);

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
      if (diff > TREND_THRESHOLD) trend = "improving";
      else if (diff < -TREND_THRESHOLD) trend = "declining";
    }

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
