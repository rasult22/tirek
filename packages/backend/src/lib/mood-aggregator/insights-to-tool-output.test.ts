import { test } from 'node:test';
import assert from 'node:assert/strict';

import { insightsToToolOutput } from './insights-to-tool-output.js';
import type { MoodInsights } from './mood-aggregator.js';

const baseInsights: MoodInsights = {
  weeklyAverage: 4,
  previousWeekAverage: 3,
  overallAverage: 3.5,
  trend: 'improving',
  topFactors: [],
  entryCount: 10,
};

test('should_return_empty_state_message_when_entry_count_is_zero', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, entryCount: 0, overallAverage: null, trend: 'neutral' },
    avgStress: null,
    avgSleep: null,
  });
  assert.equal(out.averageMood, 0);
  assert.equal(out.trend, 'stable');
  assert.equal(out.recentEntries, 0);
  assert.equal(out.insights.length, 1);
  assert.match(out.insights[0]!, /нет записей/);
});

test('should_use_overall_average_from_insights_not_recompute', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, overallAverage: 4.2, entryCount: 10 },
    avgStress: null,
    avgSleep: null,
  });
  assert.equal(out.averageMood, 4.2);
});

test('should_map_neutral_trend_to_stable_for_tool_output', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, trend: 'neutral' },
    avgStress: null,
    avgSleep: null,
  });
  assert.equal(out.trend, 'stable');
});

test('should_pass_through_recent_entries_from_entry_count', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, entryCount: 7 },
    avgStress: null,
    avgSleep: null,
  });
  assert.equal(out.recentEntries, 7);
});

test('should_include_high_mood_message_when_overall_average_at_least_4', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, overallAverage: 4.1, trend: 'stable' },
    avgStress: null,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /хорошее/.test(s)));
});

test('should_include_low_mood_message_when_overall_average_below_2', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, overallAverage: 1.5, trend: 'stable' },
    avgStress: null,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /школьным психологом/.test(s)));
});

test('should_include_improving_message_when_trend_is_improving', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, overallAverage: 3, trend: 'improving' },
    avgStress: null,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /улучшилось/.test(s)));
});

test('should_include_declining_message_when_trend_is_declining', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, overallAverage: 3, trend: 'declining' },
    avgStress: null,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /снизилось/.test(s)));
});

test('should_warn_about_high_stress_when_avg_stress_at_least_4', () => {
  const out = insightsToToolOutput({
    insights: baseInsights,
    avgStress: 4.5,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /стресса/.test(s)));
});

test('should_warn_about_poor_sleep_when_avg_sleep_at_most_2', () => {
  const out = insightsToToolOutput({
    insights: baseInsights,
    avgStress: null,
    avgSleep: 2,
  });
  assert.ok(out.insights.some((s) => /Качество сна/.test(s)));
});

test('should_advise_more_logging_when_entry_count_below_seven', () => {
  const out = insightsToToolOutput({
    insights: { ...baseInsights, entryCount: 5 },
    avgStress: null,
    avgSleep: null,
  });
  assert.ok(out.insights.some((s) => /5 записей/.test(s)));
});
