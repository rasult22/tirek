import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeStage, isSleeping, pointsToNextStage } from './plant-growth.js';

test('should_return_stage_1_for_zero_points', () => {
  assert.equal(computeStage(0), 1);
});

test('should_return_stage_1_at_upper_boundary_of_sprout_49_points', () => {
  assert.equal(computeStage(49), 1);
});

test('should_return_stage_2_at_lower_boundary_of_bush_50_points', () => {
  assert.equal(computeStage(50), 2);
});

test('should_return_stage_2_at_upper_boundary_of_bush_149_points', () => {
  assert.equal(computeStage(149), 2);
});

test('should_return_stage_3_at_lower_boundary_of_tree_150_points', () => {
  assert.equal(computeStage(150), 3);
});

test('should_return_stage_3_at_upper_boundary_of_tree_299_points', () => {
  assert.equal(computeStage(299), 3);
});

test('should_return_stage_4_at_lower_boundary_of_bloom_300_points', () => {
  assert.equal(computeStage(300), 4);
});

test('should_return_stage_4_for_points_above_bloom_threshold', () => {
  assert.equal(computeStage(10_000), 4);
});

test('should_not_sleep_when_lastWateredAt_is_null', () => {
  // Свежий пользователь без активности — не считаем растение «спящим».
  const now = new Date('2026-04-26T10:00:00.000Z');
  assert.equal(isSleeping({ lastWateredAt: null, now }), false);
});

test('should_not_sleep_when_watered_within_two_days', () => {
  const now = new Date('2026-04-26T10:00:00.000Z');
  const lastWateredAt = new Date('2026-04-25T10:00:00.000Z'); // ровно 1 день назад
  assert.equal(isSleeping({ lastWateredAt, now }), false);
});

test('should_not_sleep_at_exactly_two_days_boundary', () => {
  // Граница: 2 дня ровно — ещё не сон (sleep требует > 2 дней).
  const now = new Date('2026-04-26T10:00:00.000Z');
  const lastWateredAt = new Date('2026-04-24T10:00:00.000Z');
  assert.equal(isSleeping({ lastWateredAt, now }), false);
});

test('should_sleep_when_watered_more_than_two_days_ago', () => {
  const now = new Date('2026-04-26T10:00:00.001Z');
  const lastWateredAt = new Date('2026-04-24T10:00:00.000Z'); // > 2 дней
  assert.equal(isSleeping({ lastWateredAt, now }), true);
});

test('should_return_first_threshold_for_stage_1', () => {
  assert.equal(pointsToNextStage(0), 50);
  assert.equal(pointsToNextStage(49), 50);
});

test('should_return_remaining_to_next_threshold_for_intermediate_stages', () => {
  assert.equal(pointsToNextStage(50), 150); // в кустике, до дерева 150
  assert.equal(pointsToNextStage(149), 150);
  assert.equal(pointsToNextStage(150), 300);
  assert.equal(pointsToNextStage(299), 300);
});

test('should_return_max_threshold_at_terminal_stage_4', () => {
  // Дальше расти некуда — следующий порог совпадает с финальным.
  assert.equal(pointsToNextStage(300), 300);
  assert.equal(pointsToNextStage(10_000), 300);
});
