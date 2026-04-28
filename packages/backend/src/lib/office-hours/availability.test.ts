import { test } from 'node:test';
import assert from 'node:assert/strict';

import { infoBlockFor } from './availability.js';

test('should_return_available_now_when_now_is_inside_a_today_interval', () => {
  // 14:30 Almaty = 09:30 UTC (UTC+5, без DST)
  const now = new Date('2026-04-25T09:30:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [{ start: '13:00', end: '17:00' }],
    notes: 'в кабинете',
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'available_now',
    until: '17:00',
    notes: 'в кабинете',
  });
});

test('should_return_available_later_today_when_today_has_a_later_interval', () => {
  // 10:00 Almaty = 05:00 UTC
  const now = new Date('2026-04-25T05:00:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [{ start: '13:00', end: '17:00' }],
    notes: 'онлайн Zoom',
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'available_later_today',
    from: '13:00',
    until: '17:00',
    notes: 'онлайн Zoom',
  });
});

test('should_return_available_now_until_end_of_second_when_inside_second_of_two_intervals', () => {
  // 15:30 Almaty = 10:30 UTC
  const now = new Date('2026-04-25T10:30:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [
      { start: '09:00', end: '11:00' },
      { start: '14:00', end: '17:00' },
    ],
    notes: null,
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'available_now',
    until: '17:00',
    notes: null,
  });
});

test('should_return_available_later_today_pointing_at_second_interval_when_now_in_gap', () => {
  // 12:30 Almaty = 07:30 UTC
  const now = new Date('2026-04-25T07:30:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [
      { start: '09:00', end: '11:00' },
      { start: '14:00', end: '17:00' },
    ],
    notes: 'в кабинете',
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'available_later_today',
    from: '14:00',
    until: '17:00',
    notes: 'в кабинете',
  });
});

test('should_not_report_available_now_at_exact_end_of_interval_end_is_exclusive', () => {
  // 11:00 Almaty = 06:00 UTC — ровно конец первого интервала
  const now = new Date('2026-04-25T06:00:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [
      { start: '09:00', end: '11:00' },
      { start: '14:00', end: '17:00' },
    ],
    notes: null,
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'available_later_today',
    from: '14:00',
    until: '17:00',
    notes: null,
  });
});

// ── Сценарии issue #46: finished_today / day_off_today ───────────────

test('should_return_finished_today_when_today_intervals_all_passed_and_tomorrow_has_intervals', () => {
  // 17:30 Almaty = 12:30 UTC — после конца последнего интервала
  const now = new Date('2026-04-25T12:30:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [{ start: '09:00', end: '17:00' }],
    notes: null,
  };
  const tomorrow = {
    date: '2026-04-26',
    intervals: [{ start: '09:00', end: '17:00' }],
    notes: null,
  };

  assert.deepEqual(infoBlockFor(now, today, tomorrow), {
    kind: 'finished_today',
    lastEnd: '17:00',
    notes: null,
    tomorrowFrom: '09:00',
    tomorrowUntil: '17:00',
  });
});

test('should_return_finished_today_without_tomorrow_when_tomorrow_is_off', () => {
  // 18:00 Almaty = 13:00 UTC
  const now = new Date('2026-04-25T13:00:00.000Z');
  const today = {
    date: '2026-04-25',
    intervals: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' },
    ],
    notes: 'в кабинете',
  };

  assert.deepEqual(infoBlockFor(now, today, null), {
    kind: 'finished_today',
    lastEnd: '17:00',
    notes: 'в кабинете',
    tomorrowFrom: null,
    tomorrowUntil: null,
  });
});

test('should_return_day_off_today_when_today_has_no_intervals_and_tomorrow_has', () => {
  // 14:00 Almaty = 09:00 UTC — суббота, выходной
  const now = new Date('2026-04-25T09:00:00.000Z');
  const tomorrow = {
    date: '2026-04-26',
    intervals: [{ start: '09:00', end: '17:00' }],
    notes: null,
  };

  assert.deepEqual(infoBlockFor(now, null, tomorrow), {
    kind: 'day_off_today',
    tomorrowFrom: '09:00',
    tomorrowUntil: '17:00',
  });
});

test('should_return_day_off_today_with_null_tomorrow_when_tomorrow_also_off', () => {
  const now = new Date('2026-04-25T09:00:00.000Z');

  assert.deepEqual(infoBlockFor(now, null, null), {
    kind: 'day_off_today',
    tomorrowFrom: null,
    tomorrowUntil: null,
  });
});
