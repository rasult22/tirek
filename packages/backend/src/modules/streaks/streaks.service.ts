import { streaksRepository } from "./streaks.repository.js";
import { achievementsService } from "../achievements/achievements.service.js";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

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
    const today = todayStr();
    const existing = await streaksRepository.getByUserId(userId);

    if (!existing) {
      // First ever activity
      await streaksRepository.upsert(userId, {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        freezesAvailable: 1,
      });
      achievementsService.checkAndAward(userId, { trigger: "streak", currentStreak: 1 }).catch(() => {});
      return;
    }

    if (existing.lastActiveDate === today) {
      // Already counted today
      return;
    }

    const gap = existing.lastActiveDate
      ? daysBetween(existing.lastActiveDate, today)
      : 999;

    let newStreak: number;
    let newFreezes = existing.freezesAvailable;
    let freezeUsedDate = existing.freezeUsedDate;

    if (gap === 1) {
      // Consecutive day
      newStreak = existing.currentStreak + 1;
    } else if (gap === 2 && existing.freezesAvailable > 0) {
      // Missed 1 day, use freeze
      newStreak = existing.currentStreak + 1;
      newFreezes = existing.freezesAvailable - 1;
      freezeUsedDate = today;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongest = Math.max(existing.longestStreak, newStreak);

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
