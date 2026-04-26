import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeServiceInsights,
  type MoodEntry,
  type MoodTrend,
} from './mood-aggregator.js';
import { analyzeMoodEntries } from '../../mastra/tools/mood-analysis-core.js';

/**
 * Boundary-тест: для одного и того же набора entries
 * service-обёртка (computeServiceInsights — то, что зовёт mood.service.getInsights)
 * и tool-обёртка (analyzeMoodEntries — то, что зовёт moodAnalysisTool.execute)
 * дают согласованный trend verdict.
 *
 * Why: устраняет регрессию двойного source-of-truth тренда. Если кто-то
 * захардкодит локальный пересчёт в service или tool — этот тест упадёт.
 */

const NOW = new Date('2026-04-26T10:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function serviceTrend(entries: MoodEntry[]): MoodTrend {
  return computeServiceInsights(entries, NOW).trend;
}

function toolTrend(
  entries: MoodEntry[],
  trendThreshold?: number,
): 'improving' | 'stable' | 'declining' {
  return analyzeMoodEntries({
    entries: entries.map((e) => ({ ...e, stressLevel: null, sleepQuality: null })),
    now: NOW,
    trendThreshold,
  }).trend;
}

const SCENARIOS: Array<{ name: string; entries: MoodEntry[]; expected: MoodTrend }> = [
  {
    name: 'improving',
    entries: [
      { mood: 5, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
      { mood: 2, createdAt: daysAgo(8) },
      { mood: 2, createdAt: daysAgo(10) },
    ],
    expected: 'improving',
  },
  {
    name: 'declining',
    entries: [
      { mood: 2, createdAt: daysAgo(0) },
      { mood: 2, createdAt: daysAgo(2) },
      { mood: 5, createdAt: daysAgo(8) },
      { mood: 5, createdAt: daysAgo(10) },
    ],
    expected: 'declining',
  },
  {
    name: 'stable',
    entries: [
      { mood: 3, createdAt: daysAgo(0) },
      { mood: 3, createdAt: daysAgo(2) },
      { mood: 3, createdAt: daysAgo(8) },
      { mood: 3, createdAt: daysAgo(10) },
    ],
    expected: 'stable',
  },
  {
    name: 'neutral_no_data',
    entries: [],
    expected: 'neutral',
  },
  {
    name: 'edge_case_only_recent_week',
    entries: [
      { mood: 4, createdAt: daysAgo(0) },
      { mood: 5, createdAt: daysAgo(2) },
    ],
    expected: 'stable',
  },
];

for (const { name, entries, expected } of SCENARIOS) {
  test(`consistency_${name}: service и tool возвращают согласованный verdict`, () => {
    const service = serviceTrend(entries);
    const tool = toolTrend(entries);

    assert.equal(service, expected, `service trend mismatch in ${name}`);
    // Tool сворачивает 'neutral' в 'stable' (диктуется output-схемой tool, не разной логикой).
    const expectedToolTrend = expected === 'neutral' ? 'stable' : expected;
    assert.equal(tool, expectedToolTrend, `tool trend mismatch in ${name}`);
  });
}

test('threshold_regression: смена threshold отражается на обоих consumer\'ах', () => {
  // Diff = 0.4 → при threshold=0.3 это improving, при threshold=0.5 — stable.
  // Если бы один из consumer'ов хардкодил threshold локально, тест поймал бы регрессию.
  const entries: MoodEntry[] = [
    { mood: 4, createdAt: daysAgo(0) },
    { mood: 4, createdAt: daysAgo(2) },
    { mood: 3.6, createdAt: daysAgo(8) },
    { mood: 3.6, createdAt: daysAgo(10) },
  ];

  // Сервис использует только DEFAULT_TREND_THRESHOLD=0.3 (нет API для другого).
  // Поэтому регрессию service ловим через сценарий-проверку:
  // если бы service внутри переключился на 0.5, его trend перестал бы быть improving.
  assert.equal(serviceTrend(entries), 'improving');

  // Tool принимает override threshold — проверяем, что при 0.3 verdict совпадает с service,
  // а при 0.5 — отличается, и оба конца цепочки реагируют на параметр.
  assert.equal(toolTrend(entries, 0.3), 'improving');
  assert.equal(toolTrend(entries, 0.5), 'stable');
});
