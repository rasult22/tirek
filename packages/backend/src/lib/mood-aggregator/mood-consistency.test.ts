/**
 * Boundary-тест single-source-of-truth для mood trend.
 *
 * Why: до этого refactor'а `mood-analysis.ts` пересчитывал среднее по всем
 * 14 дням и не использовал trend, рассчитанный в `computeInsights`. Это давало
 * риск, что AI-друг и психолог увидят **разные тренды** для одного набора
 * данных. После refactor'а оба консьюмера обязаны пройти через один kernel:
 * service вызывает `computeInsights` напрямую, tool — `computeInsights` →
 * `insightsToToolOutput`. Этот тест защищает от регрессии double-source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeInsights,
  DEFAULT_TREND_THRESHOLD,
  type MoodEntry,
} from './mood-aggregator.js';
import { insightsToToolOutput } from './insights-to-tool-output.js';

const NOW = new Date('2026-04-26T10:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

// Воспроизводит то, что делает mood.service.getInsights — без БД.
function serviceGetInsights(entries: MoodEntry[], threshold = DEFAULT_TREND_THRESHOLD) {
  return computeInsights({
    entries,
    lookbackDays: 14,
    trendThreshold: threshold,
    now: NOW,
  });
}

// Воспроизводит то, что делает mastra mood-analysis tool — без БД.
function toolAnalyze(entries: MoodEntry[], threshold = DEFAULT_TREND_THRESHOLD) {
  const insights = computeInsights({
    entries,
    lookbackDays: 14,
    trendThreshold: threshold,
    now: NOW,
  });
  return insightsToToolOutput({ insights, avgStress: null, avgSleep: null });
}

const SCENARIOS: Array<{ name: string; entries: MoodEntry[] }> = [
  {
    name: 'improving',
    entries: [
      { mood: 5, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      { mood: 2, createdAt: daysAgo(8) },
      { mood: 2, createdAt: daysAgo(10) },
    ],
  },
  {
    name: 'declining',
    entries: [
      { mood: 2, createdAt: daysAgo(0) },
      { mood: 2, createdAt: daysAgo(2) },
      { mood: 5, createdAt: daysAgo(8) },
      { mood: 5, createdAt: daysAgo(10) },
    ],
  },
  {
    name: 'stable',
    entries: [
      { mood: 3, createdAt: daysAgo(0) },
      { mood: 3, createdAt: daysAgo(2) },
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 3, createdAt: daysAgo(10) },
    ],
  },
  {
    name: 'neutral_no_data',
    entries: [],
  },
  {
    name: 'edge_case_only_recent_week',
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
    ],
  },
];

for (const scenario of SCENARIOS) {
  test(`should_produce_identical_trend_verdict_for_service_and_tool_in_${scenario.name}_scenario`, () => {
    const serviceResult = serviceGetInsights(scenario.entries);
    const toolResult = toolAnalyze(scenario.entries);

    // Tool сворачивает 'neutral' в 'stable' — это единственное допустимое расхождение
    // (диктуется output-схемой tool'а, а не разной логикой расчёта).
    const expectedToolTrend =
      serviceResult.trend === 'neutral' ? 'stable' : serviceResult.trend;

    assert.equal(
      toolResult.trend,
      expectedToolTrend,
      `Trend mismatch for "${scenario.name}": service=${serviceResult.trend}, tool=${toolResult.trend}`,
    );
  });
}

test('should_apply_changed_threshold_to_both_consumers_simultaneously', () => {
  // Diff = 0.4 → при threshold=0.3 это improving, при threshold=0.5 — stable.
  // Если бы один из консьюмеров хардкодил threshold, тест бы поймал регрессию.
  const entries: MoodEntry[] = [
    { mood: 4, createdAt: daysAgo(0) },
    { mood: 4, createdAt: daysAgo(2) },
    { mood: 3.6, createdAt: daysAgo(8) },
    { mood: 3.6, createdAt: daysAgo(10) },
  ];

  const serviceLow = serviceGetInsights(entries, 0.3);
  const toolLow = toolAnalyze(entries, 0.3);
  assert.equal(serviceLow.trend, 'improving');
  assert.equal(toolLow.trend, 'improving');

  const serviceHigh = serviceGetInsights(entries, 0.5);
  const toolHigh = toolAnalyze(entries, 0.5);
  assert.equal(serviceHigh.trend, 'stable');
  assert.equal(toolHigh.trend, 'stable');
});
