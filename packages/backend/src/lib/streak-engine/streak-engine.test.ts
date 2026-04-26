import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeStreak } from './streak-engine.js';

test('should_start_streak_at_one_when_no_previous_activity', () => {
  const result = computeStreak({
    lastActiveDate: null,
    currentDay: '2026-04-26',
    currentStreak: 0,
    freezesAvailable: 1,
  });

  assert.deepEqual(result, {
    newStreak: 1,
    newFreezes: 1,
    freezeUsed: false,
  });
});

test('should_increment_streak_when_gap_is_one_almaty_day', () => {
  const result = computeStreak({
    lastActiveDate: '2026-04-25',
    currentDay: '2026-04-26',
    currentStreak: 4,
    freezesAvailable: 1,
  });

  assert.deepEqual(result, {
    newStreak: 5,
    newFreezes: 1,
    freezeUsed: false,
  });
});

test('should_use_freeze_and_increment_streak_when_gap_is_two_with_freeze_available', () => {
  // Пропуск 1 дня → freeze покрывает, streak растёт.
  const result = computeStreak({
    lastActiveDate: '2026-04-24',
    currentDay: '2026-04-26',
    currentStreak: 7,
    freezesAvailable: 1,
  });

  assert.deepEqual(result, {
    newStreak: 8,
    newFreezes: 0,
    freezeUsed: true,
  });
});

test('should_reset_streak_to_one_when_gap_is_two_without_freeze', () => {
  const result = computeStreak({
    lastActiveDate: '2026-04-24',
    currentDay: '2026-04-26',
    currentStreak: 7,
    freezesAvailable: 0,
  });

  assert.deepEqual(result, {
    newStreak: 1,
    newFreezes: 0,
    freezeUsed: false,
  });
});

test('should_reset_streak_to_one_when_gap_is_greater_than_two_even_with_freeze', () => {
  // Один freeze покрывает только один день, не несколько.
  const result = computeStreak({
    lastActiveDate: '2026-04-20',
    currentDay: '2026-04-26',
    currentStreak: 7,
    freezesAvailable: 1,
  });

  assert.deepEqual(result, {
    newStreak: 1,
    newFreezes: 1,
    freezeUsed: false,
  });
});

test('should_keep_streak_unchanged_when_activity_is_same_almaty_day', () => {
  // Уже была Productive Action сегодня — повторная не двигает стрик.
  const result = computeStreak({
    lastActiveDate: '2026-04-26',
    currentDay: '2026-04-26',
    currentStreak: 5,
    freezesAvailable: 1,
  });

  assert.deepEqual(result, {
    newStreak: 5,
    newFreezes: 1,
    freezeUsed: false,
  });
});
