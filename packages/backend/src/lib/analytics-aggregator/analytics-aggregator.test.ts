import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeClassStats } from './analytics-aggregator.js';

function entry(mood: number, factors: string[] | null = null): { mood: number; factors: string[] | null } {
  return { mood, factors };
}

function session(severity: 'low' | 'moderate' | 'high' | null, completedAt: Date | null = new Date()): { severity: 'low' | 'moderate' | 'high' | null; completedAt: Date | null } {
  return { severity, completedAt };
}

test('empty_class_returns_zeros_and_null_average_mood', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [],
    totalStudents: 0,
  });

  assert.equal(stats.averageMood, null);
  assert.deepEqual(stats.moodDistribution, { happy: 0, neutral: 0, sad: 0 });
  assert.equal(stats.testCompletionRate, 0);
  assert.equal(stats.atRiskCount, 0);
  assert.deepEqual(stats.riskDistribution, { normal: 0, attention: 0, crisis: 0 });
  assert.deepEqual(stats.topFactors, []);
});

test('average_mood_is_arithmetic_mean_of_mood_entries', () => {
  const stats = computeClassStats({
    entries: [entry(3), entry(5), entry(4)],
    sessions: [],
    totalStudents: 3,
  });

  assert.equal(stats.averageMood, 4);
});

test('risk_distribution_maps_low_to_normal_moderate_to_attention_high_to_crisis', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [
      session('low'),
      session('low'),
      session('moderate'),
      session('high'),
      session('high'),
      session('high'),
    ],
    totalStudents: 6,
  });

  assert.deepEqual(stats.riskDistribution, { normal: 2, attention: 1, crisis: 3 });
});

test('test_completion_rate_is_completed_sessions_divided_by_total_students', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [
      session('low', new Date()),
      session('moderate', new Date()),
      session('high', new Date()),
      session('low', new Date()),
    ],
    totalStudents: 8,
  });

  assert.equal(stats.testCompletionRate, 0.5);
});

test('test_completion_rate_excludes_sessions_with_null_completed_at', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [
      session('low', new Date()),
      session('low', null),
      session('low', null),
    ],
    totalStudents: 4,
  });

  assert.equal(stats.testCompletionRate, 0.25);
});

test('null_severity_session_is_excluded_from_risk_distribution', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [
      session(null),
      session('low'),
      session(null),
    ],
    totalStudents: 3,
  });

  assert.deepEqual(stats.riskDistribution, { normal: 1, attention: 0, crisis: 0 });
  assert.equal(stats.atRiskCount, 0);
});

test('test_completion_rate_is_zero_when_no_students', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [session('low', new Date())],
    totalStudents: 0,
  });

  assert.equal(stats.testCompletionRate, 0);
});

test('at_risk_count_is_sum_of_attention_and_crisis_only', () => {
  const stats = computeClassStats({
    entries: [],
    sessions: [
      session('low'),
      session('low'),
      session('moderate'),
      session('high'),
    ],
    totalStudents: 4,
  });

  assert.equal(stats.atRiskCount, 2);
});

test('top_factors_returns_factors_sorted_by_count_descending', () => {
  const stats = computeClassStats({
    entries: [
      entry(3, ['exam', 'sleep']),
      entry(3, ['exam']),
      entry(3, ['exam', 'family']),
      entry(3, ['sleep']),
    ],
    sessions: [],
    totalStudents: 4,
  });

  assert.deepEqual(stats.topFactors, [
    { factor: 'exam', count: 3 },
    { factor: 'sleep', count: 2 },
    { factor: 'family', count: 1 },
  ]);
});

test('top_factors_caps_result_at_five', () => {
  const stats = computeClassStats({
    entries: [
      entry(3, ['a', 'b', 'c', 'd', 'e', 'f', 'g']),
    ],
    sessions: [],
    totalStudents: 1,
  });

  assert.equal(stats.topFactors.length, 5);
});

test('top_factors_ignores_entries_with_null_factors', () => {
  const stats = computeClassStats({
    entries: [
      entry(3, null),
      entry(3, ['exam']),
      entry(3, null),
    ],
    sessions: [],
    totalStudents: 3,
  });

  assert.deepEqual(stats.topFactors, [{ factor: 'exam', count: 1 }]);
});

test('mood_distribution_buckets_4_and_5_as_happy_3_as_neutral_1_and_2_as_sad', () => {
  const stats = computeClassStats({
    entries: [entry(5), entry(4), entry(3), entry(3), entry(2), entry(1)],
    sessions: [],
    totalStudents: 6,
  });

  assert.deepEqual(stats.moodDistribution, { happy: 2, neutral: 2, sad: 2 });
});
