import { daysBetween, startOfDay } from '../almaty-day/almaty-day.js';

export type ComputeStreakInput = {
  lastActiveDate: string | null;
  currentDay: string;
  currentStreak: number;
  freezesAvailable: number;
};

export type ComputeStreakOutput = {
  newStreak: number;
  newFreezes: number;
  freezeUsed: boolean;
};

function gapInAlmatyDays(from: string, to: string): number {
  return daysBetween(startOfDay(from), startOfDay(to));
}

export function computeStreak(input: ComputeStreakInput): ComputeStreakOutput {
  if (input.lastActiveDate === null) {
    return {
      newStreak: 1,
      newFreezes: input.freezesAvailable,
      freezeUsed: false,
    };
  }

  const gap = gapInAlmatyDays(input.lastActiveDate, input.currentDay);

  if (gap === 0) {
    return {
      newStreak: input.currentStreak,
      newFreezes: input.freezesAvailable,
      freezeUsed: false,
    };
  }

  if (gap === 1) {
    return {
      newStreak: input.currentStreak + 1,
      newFreezes: input.freezesAvailable,
      freezeUsed: false,
    };
  }

  if (gap === 2 && input.freezesAvailable > 0) {
    return {
      newStreak: input.currentStreak + 1,
      newFreezes: input.freezesAvailable - 1,
      freezeUsed: true,
    };
  }

  return {
    newStreak: 1,
    newFreezes: input.freezesAvailable,
    freezeUsed: false,
  };
}
