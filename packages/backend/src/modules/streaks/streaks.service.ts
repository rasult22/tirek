import { streaksRepository } from "./streaks.repository.js";
import { achievementsService } from "../achievements/achievements.service.js";
import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import { computeStreak } from "../../lib/streak-engine/streak-engine.js";

export const streaksService = {
  async getStreak(userId: string) {
    const streak = await streaksRepository.getByUserId(userId);
    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        freezesAvailable: 1,
      };
    }
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      freezesAvailable: streak.freezesAvailable,
    };
  },

  async recordActivity(userId: string) {
    const today = currentDay();
    const existing = await streaksRepository.getByUserId(userId);

    const { newStreak, newFreezes, freezeUsed } = computeStreak({
      lastActiveDate: existing?.lastActiveDate ?? null,
      currentDay: today,
      currentStreak: existing?.currentStreak ?? 0,
      freezesAvailable: existing?.freezesAvailable ?? 1,
    });

    // Same Almaty Day → no-op (engine returns unchanged streak, but we still skip the write).
    if (existing?.lastActiveDate === today) {
      return;
    }

    const newLongest = Math.max(existing?.longestStreak ?? 0, newStreak);
    const freezeUsedDate = freezeUsed ? today : existing?.freezeUsedDate ?? null;

    await streaksRepository.upsert(userId, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      freezesAvailable: newFreezes,
      freezeUsedDate,
    });
    achievementsService.checkAndAward(userId, { trigger: "streak", currentStreak: newStreak }).catch(() => {});
  },
};
