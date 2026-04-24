import { test } from 'node:test';
import assert from 'node:assert/strict';

import { slotOf, currentDay, isSameDay, daysBetween, startOfDay, endOfDay } from './almaty-day.js';

test('should_place_17_59_local_in_day_slot', () => {
  // 17:59 Asia/Almaty = 12:59 UTC (UTC+5, без DST)
  const timestamp = new Date('2026-04-24T12:59:00.000Z');
  assert.equal(slotOf(timestamp), 'day');
});

test('should_place_18_00_local_in_evening_slot', () => {
  // 18:00 Asia/Almaty = 13:00 UTC
  const timestamp = new Date('2026-04-24T13:00:00.000Z');
  assert.equal(slotOf(timestamp), 'evening');
});

test('should_use_almaty_local_hour_not_utc_hour_for_slot', () => {
  // 15:30 UTC — в UTC это «день», но в Almaty это 20:30 → evening
  const timestamp = new Date('2026-04-24T15:30:00.000Z');
  assert.equal(slotOf(timestamp), 'evening');
});

test('should_consider_two_timestamps_same_almaty_day_when_utc_days_differ', () => {
  // 00:30 Almaty 25 апр = 19:30 UTC 24 апр
  const earlyMorning = new Date('2026-04-24T19:30:00.000Z');
  // 23:30 Almaty 25 апр = 18:30 UTC 25 апр
  const lateNight = new Date('2026-04-25T18:30:00.000Z');
  // В UTC это разные дни (24 и 25), но в Almaty это оба — 25 апр.
  assert.equal(isSameDay(earlyMorning, lateNight), true);
});

test('should_reject_timestamps_from_adjacent_almaty_days_as_same_day', () => {
  // 23:59 Almaty 24 апр
  const beforeMidnight = new Date('2026-04-24T18:59:00.000Z');
  // 00:01 Almaty 25 апр
  const afterMidnight = new Date('2026-04-24T19:01:00.000Z');
  assert.equal(isSameDay(beforeMidnight, afterMidnight), false);
});

test('should_count_days_between_across_month_boundary', () => {
  // 30 апр 2026 12:00 Almaty → 2 мая 2026 12:00 Almaty = 2 календарных дня
  const aprilThirtieth = new Date('2026-04-30T07:00:00.000Z');
  const maySecond = new Date('2026-05-02T07:00:00.000Z');
  assert.equal(daysBetween(aprilThirtieth, maySecond), 2);
});

test('should_use_injected_now_deterministically_for_current_day', () => {
  // Тот же "сейчас" всегда даёт тот же день, без обращения к системным часам.
  const injected = new Date('2026-04-24T10:00:00.000Z');
  assert.equal(currentDay(injected), currentDay(injected));
  assert.equal(currentDay(injected), '2026-04-24');
});

test('should_return_utc_instant_for_midnight_almaty_at_start_of_day', () => {
  // 00:00 Almaty 24 апр 2026 = 19:00 UTC 23 апр 2026
  const result = startOfDay('2026-04-24');
  assert.equal(result.toISOString(), '2026-04-23T19:00:00.000Z');
  // currentDay этого инстанта должен вернуть тот же день
  assert.equal(currentDay(result), '2026-04-24');
});

test('should_return_last_millisecond_of_almaty_day_at_end_of_day', () => {
  // 23:59:59.999 Almaty 24 апр 2026 = 18:59:59.999 UTC 24 апр 2026
  const result = endOfDay('2026-04-24');
  assert.equal(result.toISOString(), '2026-04-24T18:59:59.999Z');
  assert.equal(currentDay(result), '2026-04-24');
});

test('should_count_days_between_across_year_boundary_regardless_of_argument_order', () => {
  // 31 дек 2025 12:00 Almaty → 2 янв 2026 12:00 Almaty = 2 дня
  const decemberLast = new Date('2025-12-31T07:00:00.000Z');
  const januarySecond = new Date('2026-01-02T07:00:00.000Z');
  assert.equal(daysBetween(decemberLast, januarySecond), 2);
  assert.equal(daysBetween(januarySecond, decemberLast), 2);
});

test('should_rollover_year_at_almaty_midnight', () => {
  // 23:59 Almaty 31 дек 2025 = 18:59 UTC 31 дек 2025 → "2025-12-31"
  const lastSecondOfYear = new Date('2025-12-31T18:59:00.000Z');
  // 00:01 Almaty 1 янв 2026 = 19:01 UTC 31 дек 2025 → "2026-01-01"
  const firstMinuteOfYear = new Date('2025-12-31T19:01:00.000Z');

  assert.equal(currentDay(lastSecondOfYear), '2025-12-31');
  assert.equal(currentDay(firstMinuteOfYear), '2026-01-01');
});

test('should_return_different_almaty_days_across_local_midnight', () => {
  // 23:59 Almaty 24 апр = 18:59 UTC 24 апр → "2026-04-24"
  const beforeMidnight = new Date('2026-04-24T18:59:00.000Z');
  // 00:01 Almaty 25 апр = 19:01 UTC 24 апр → "2026-04-25"
  const afterMidnight = new Date('2026-04-24T19:01:00.000Z');

  assert.equal(currentDay(beforeMidnight), '2026-04-24');
  assert.equal(currentDay(afterMidnight), '2026-04-25');
});
