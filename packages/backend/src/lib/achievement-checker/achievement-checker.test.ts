import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCandidateSlugs,
  isConditionMet,
  type AchievementContext,
} from './achievement-checker.js';

const emptyCtx: AchievementContext = {
  moodCount: 0,
  exerciseCount: 0,
  breathingExerciseCount: 0,
  journalCount: 0,
  completedTestSessionsCount: 0,
  distinctCompletedTestsCount: 0,
  totalTestsCount: 0,
  currentStreak: 0,
  plantStage: 1,
};

test('should_return_mood_slugs_for_mood_trigger', () => {
  assert.deepEqual(getCandidateSlugs('mood'), ['first-mood', 'mood-expert']);
});

test('should_return_exercise_slugs_for_exercise_trigger', () => {
  assert.deepEqual(getCandidateSlugs('exercise'), [
    'first-exercise',
    'breathing-master',
    'exercise-master',
  ]);
});

test('should_return_journal_slugs_for_journal_trigger', () => {
  assert.deepEqual(getCandidateSlugs('journal'), ['first-journal', 'journal-keeper']);
});

test('should_return_test_slugs_for_test_trigger', () => {
  assert.deepEqual(getCandidateSlugs('test'), ['first-test', 'test-explorer', 'all-tests']);
});

test('should_return_streak_slugs_for_streak_trigger', () => {
  assert.deepEqual(getCandidateSlugs('streak'), ['streak-3', 'streak-7', 'streak-30']);
});

test('should_return_plant_slugs_for_plant_trigger', () => {
  assert.deepEqual(getCandidateSlugs('plant'), ['plant-sprout', 'plant-tree', 'plant-bloom']);
});

// ── first-mood: 1+ mood entry ──────────────────────────────────────
test('first_mood_should_NOT_meet_when_moodCount_is_zero', () => {
  assert.equal(isConditionMet('first-mood', emptyCtx), false);
});

test('first_mood_should_meet_when_moodCount_is_one', () => {
  assert.equal(isConditionMet('first-mood', { ...emptyCtx, moodCount: 1 }), true);
});

// ── first-exercise / first-journal / first-test ──────────────────
test('first_exercise_should_meet_when_exerciseCount_is_one', () => {
  assert.equal(isConditionMet('first-exercise', emptyCtx), false);
  assert.equal(isConditionMet('first-exercise', { ...emptyCtx, exerciseCount: 1 }), true);
});

test('first_journal_should_meet_when_journalCount_is_one', () => {
  assert.equal(isConditionMet('first-journal', emptyCtx), false);
  assert.equal(isConditionMet('first-journal', { ...emptyCtx, journalCount: 1 }), true);
});

test('first_test_should_meet_when_completedTestSessionsCount_is_one', () => {
  assert.equal(isConditionMet('first-test', emptyCtx), false);
  assert.equal(
    isConditionMet('first-test', { ...emptyCtx, completedTestSessionsCount: 1 }),
    true,
  );
});

// ── streak achievements ──────────────────────────────────────────
test('streak_3_should_meet_at_threshold', () => {
  assert.equal(isConditionMet('streak-3', { ...emptyCtx, currentStreak: 2 }), false);
  assert.equal(isConditionMet('streak-3', { ...emptyCtx, currentStreak: 3 }), true);
});

test('streak_7_should_meet_at_threshold', () => {
  assert.equal(isConditionMet('streak-7', { ...emptyCtx, currentStreak: 6 }), false);
  assert.equal(isConditionMet('streak-7', { ...emptyCtx, currentStreak: 7 }), true);
});

test('streak_30_should_meet_at_threshold', () => {
  assert.equal(isConditionMet('streak-30', { ...emptyCtx, currentStreak: 29 }), false);
  assert.equal(isConditionMet('streak-30', { ...emptyCtx, currentStreak: 30 }), true);
});

// ── mastery: breathing-master 10 ──────────────────────────────────
test('breathing_master_should_meet_at_ten_breathing_exercises', () => {
  assert.equal(
    isConditionMet('breathing-master', { ...emptyCtx, breathingExerciseCount: 9 }),
    false,
  );
  assert.equal(
    isConditionMet('breathing-master', { ...emptyCtx, breathingExerciseCount: 10 }),
    true,
  );
});

test('breathing_master_should_NOT_count_non_breathing_exercises', () => {
  // Имеем 100 общих, но 0 breathing — порог не достигнут.
  assert.equal(
    isConditionMet('breathing-master', {
      ...emptyCtx,
      exerciseCount: 100,
      breathingExerciseCount: 0,
    }),
    false,
  );
});

// ── mastery: exercise-master 25 ──────────────────────────────────
test('exercise_master_should_meet_at_twenty_five_exercises', () => {
  assert.equal(isConditionMet('exercise-master', { ...emptyCtx, exerciseCount: 24 }), false);
  assert.equal(isConditionMet('exercise-master', { ...emptyCtx, exerciseCount: 25 }), true);
});

// ── mastery: mood-expert 30 ──────────────────────────────────────
test('mood_expert_should_meet_at_thirty_mood_entries', () => {
  assert.equal(isConditionMet('mood-expert', { ...emptyCtx, moodCount: 29 }), false);
  assert.equal(isConditionMet('mood-expert', { ...emptyCtx, moodCount: 30 }), true);
});

// ── mastery: journal-keeper 15 ──────────────────────────────────
test('journal_keeper_should_meet_at_fifteen_journal_entries', () => {
  assert.equal(isConditionMet('journal-keeper', { ...emptyCtx, journalCount: 14 }), false);
  assert.equal(isConditionMet('journal-keeper', { ...emptyCtx, journalCount: 15 }), true);
});

// ── mastery: test-explorer 3 distinct ─────────────────────────────
test('test_explorer_should_meet_at_three_distinct_tests', () => {
  assert.equal(
    isConditionMet('test-explorer', { ...emptyCtx, distinctCompletedTestsCount: 2 }),
    false,
  );
  assert.equal(
    isConditionMet('test-explorer', { ...emptyCtx, distinctCompletedTestsCount: 3 }),
    true,
  );
});

// ── mastery: all-tests ────────────────────────────────────────────
test('all_tests_should_meet_when_distinct_completed_equals_total', () => {
  assert.equal(
    isConditionMet('all-tests', {
      ...emptyCtx,
      totalTestsCount: 5,
      distinctCompletedTestsCount: 5,
    }),
    true,
  );
});

test('all_tests_should_NOT_meet_when_distinct_completed_below_total', () => {
  assert.equal(
    isConditionMet('all-tests', {
      ...emptyCtx,
      totalTestsCount: 5,
      distinctCompletedTestsCount: 4,
    }),
    false,
  );
});

test('all_tests_should_NOT_meet_when_catalog_is_empty', () => {
  // Пустой каталог: формально 0 >= 0 — не должно засчитываться.
  assert.equal(
    isConditionMet('all-tests', {
      ...emptyCtx,
      totalTestsCount: 0,
      distinctCompletedTestsCount: 0,
    }),
    false,
  );
});

// ── growth: plant-sprout / plant-tree / plant-bloom ──────────────
test('plant_sprout_should_meet_at_stage_2', () => {
  assert.equal(isConditionMet('plant-sprout', { ...emptyCtx, plantStage: 1 }), false);
  assert.equal(isConditionMet('plant-sprout', { ...emptyCtx, plantStage: 2 }), true);
});

test('plant_tree_should_meet_at_stage_3', () => {
  assert.equal(isConditionMet('plant-tree', { ...emptyCtx, plantStage: 2 }), false);
  assert.equal(isConditionMet('plant-tree', { ...emptyCtx, plantStage: 3 }), true);
});

test('plant_bloom_should_meet_at_stage_4', () => {
  assert.equal(isConditionMet('plant-bloom', { ...emptyCtx, plantStage: 3 }), false);
  assert.equal(isConditionMet('plant-bloom', { ...emptyCtx, plantStage: 4 }), true);
});

test('unknown_slug_should_return_false', () => {
  assert.equal(isConditionMet('does-not-exist', emptyCtx), false);
});
