import { v4 as uuidv4 } from "uuid";
import { ValidationError } from "../../shared/errors.js";
import { moodRepository } from "./mood.repository.js";
import { latestPerSlot, groupByAlmatyDay } from "./mood-slots.js";
import { streaksService } from "../streaks/streaks.service.js";
import { virtualPlantService } from "../virtual-plant/virtual-plant.service.js";
import { achievementsService } from "../achievements/achievements.service.js";
import { startOfDay, endOfDay } from "../../lib/almaty-day/almaty-day.js";
import {
  computeInsights,
  DEFAULT_TREND_THRESHOLD,
} from "../../lib/mood-aggregator/mood-aggregator.js";

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
    return computeInsights({
      entries: entries.map((e) => ({
        mood: e.mood,
        factors: e.factors as string[] | null,
        createdAt: e.createdAt,
      })),
      lookbackDays: 14,
      trendThreshold: DEFAULT_TREND_THRESHOLD,
      now: new Date(),
    });
  },
};
