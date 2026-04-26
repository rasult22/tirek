import { streaksRepository } from "./streaks.repository.js";

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
};
