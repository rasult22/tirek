import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeInsights, DEFAULT_TREND_THRESHOLD } from './mood-aggregator.js';

const NOW = new Date('2026-04-26T10:00:00.000Z');

test('should_return_neutral_trend_and_null_average_for_empty_entries', () => {
  const result = computeInsights({
    entries: [],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.deepEqual(result, {
    weeklyAverage: null,
    previousWeekAverage: null,
    overallAverage: null,
    trend: 'neutral',
    topFactors: [],
    entryCount: 0,
  });
});

// Хелпер: смещение в днях относительно NOW.
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

test('should_return_stable_and_weekly_average_when_only_recent_week_has_data', () => {
  const result = computeInsights({
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(1) },
      { mood: 3, createdAt: daysAgo(2) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.trend, 'stable');
  assert.equal(result.weeklyAverage, 4); // (4+5+3)/3 = 4
  assert.deepEqual(result.topFactors, []);
});

test('should_return_improving_when_recent_average_exceeds_previous_by_more_than_threshold', () => {
  const result = computeInsights({
    entries: [
      // Свежая неделя: avg = 4.5
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      // Прошлая неделя: avg = 3 → diff = 1.5 > 0.3
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 3, createdAt: daysAgo(10) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.trend, 'improving');
});

test('should_return_declining_when_recent_average_below_previous_by_more_than_threshold', () => {
  const result = computeInsights({
    entries: [
      { mood: 2, createdAt: daysAgo(0) },
      { mood: 2, createdAt: daysAgo(2) },
      { mood: 5, createdAt: daysAgo(8) },
      { mood: 5, createdAt: daysAgo(10) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.trend, 'declining');
});

test('should_remain_stable_when_diff_equals_threshold', () => {
  // diff = 0.3 ровно — не считается ни improving, ни declining (строго больше).
  const result = computeInsights({
    entries: [
      { mood: 4.3, createdAt: daysAgo(0) },
      { mood: 4, createdAt: daysAgo(8) },
    ],
    lookbackDays: 14,
    trendThreshold: 0.3,
    now: NOW,
  });
  assert.equal(result.trend, 'stable');
});

test('should_respect_custom_trend_threshold', () => {
  // С threshold=1.0 разница 0.5 уже не считается improving.
  const result = computeInsights({
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 3.5, createdAt: daysAgo(8) },
    ],
    lookbackDays: 14,
    trendThreshold: 1.0,
    now: NOW,
  });
  assert.equal(result.trend, 'stable');
});

test('should_aggregate_top_factors_sorted_by_count_desc_and_limit_to_five', () => {
  const result = computeInsights({
    entries: [
      { mood: 3, factors: ['school', 'sleep'], createdAt: daysAgo(0) },
      { mood: 3, factors: ['school', 'family'], createdAt: daysAgo(1) },
      { mood: 3, factors: ['school'], createdAt: daysAgo(2) },
      { mood: 3, factors: ['friends'], createdAt: daysAgo(3) },
      { mood: 3, factors: ['health'], createdAt: daysAgo(4) },
      { mood: 3, factors: ['weather'], createdAt: daysAgo(5) },
      { mood: 3, factors: ['hobby'], createdAt: daysAgo(6) }, // 7-й уникальный — не должен попасть в топ
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.topFactors[0]?.factor, 'school');
  assert.equal(result.topFactors[0]?.count, 3);
  assert.equal(result.topFactors.length, 5);
});

test('should_return_previous_week_average_when_previous_week_has_data', () => {
  const result = computeInsights({
    entries: [
      // Свежая неделя
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      // Прошлая неделя: avg = 3
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 3, createdAt: daysAgo(10) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.previousWeekAverage, 3);
});

test('should_return_null_previous_week_average_when_only_recent_week_has_data', () => {
  const result = computeInsights({
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.previousWeekAverage, null);
});

test('should_return_null_previous_week_average_for_empty_entries', () => {
  const result = computeInsights({
    entries: [],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.previousWeekAverage, null);
});

test('should_count_entries_within_lookback_window', () => {
  const result = computeInsights({
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 3, createdAt: daysAgo(13) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.entryCount, 4);
});

test('should_return_zero_entry_count_for_empty_entries', () => {
  const result = computeInsights({
    entries: [],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.entryCount, 0);
});

test('should_compute_overall_average_across_full_lookback_window', () => {
  // Среднее = (4+5+3+0)/4 = 3 → tool ожидает round1 = 3.0, но MoodInsights считаем round2.
  const result = computeInsights({
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 0, createdAt: daysAgo(13) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.overallAverage, 3);
});

test('should_return_null_overall_average_for_empty_entries', () => {
  const result = computeInsights({
    entries: [],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.equal(result.overallAverage, null);
});

test('should_ignore_null_or_missing_factors_field', () => {
  const result = computeInsights({
    entries: [
      { mood: 3, createdAt: daysAgo(0) },
      { mood: 3, factors: null, createdAt: daysAgo(1) },
      { mood: 3, factors: ['x'], createdAt: daysAgo(2) },
    ],
    lookbackDays: 14,
    trendThreshold: DEFAULT_TREND_THRESHOLD,
    now: NOW,
  });
  assert.deepEqual(result.topFactors, [{ factor: 'x', count: 1 }]);
});
