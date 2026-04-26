import { test } from 'node:test';
import assert from 'node:assert/strict';

import { latestPerSlot, groupByAlmatyDay } from './mood-slots.js';

type Entry = { id: string; mood: number; createdAt: Date };

test('should_return_null_for_both_slots_when_no_entries', () => {
  const result = latestPerSlot([] as Entry[]);
  assert.deepEqual(result, { daySlot: null, eveningSlot: null });
});

test('should_place_entry_before_18_almaty_in_day_slot', () => {
  // 17:59 Almaty 26 апр = 12:59 UTC 26 апр
  const e: Entry = { id: 'a', mood: 4, createdAt: new Date('2026-04-26T12:59:00.000Z') };
  const result = latestPerSlot([e]);
  assert.equal(result.daySlot?.id, 'a');
  assert.equal(result.eveningSlot, null);
});

test('should_place_entry_at_or_after_18_almaty_in_evening_slot', () => {
  // 18:00 Almaty = 13:00 UTC
  const e: Entry = { id: 'b', mood: 5, createdAt: new Date('2026-04-26T13:00:00.000Z') };
  const result = latestPerSlot([e]);
  assert.equal(result.eveningSlot?.id, 'b');
  assert.equal(result.daySlot, null);
});

test('should_keep_latest_when_multiple_entries_in_same_slot', () => {
  const earlier: Entry = { id: 'early', mood: 3, createdAt: new Date('2026-04-26T04:00:00.000Z') };
  const later: Entry = { id: 'later', mood: 4, createdAt: new Date('2026-04-26T05:00:00.000Z') };
  const result = latestPerSlot([earlier, later]);
  assert.equal(result.daySlot?.id, 'later');
});

test('should_return_one_entry_per_slot_when_one_in_each', () => {
  const morning: Entry = { id: 'm', mood: 4, createdAt: new Date('2026-04-26T05:00:00.000Z') };
  const evening: Entry = { id: 'e', mood: 3, createdAt: new Date('2026-04-26T15:00:00.000Z') };
  const result = latestPerSlot([morning, evening]);
  assert.equal(result.daySlot?.id, 'm');
  assert.equal(result.eveningSlot?.id, 'e');
});

test('should_group_entries_by_almaty_day_with_two_slots_per_day', () => {
  const day1Morning: Entry = { id: 'd1m', mood: 3, createdAt: new Date('2026-04-25T05:00:00.000Z') };
  const day1Evening: Entry = { id: 'd1e', mood: 4, createdAt: new Date('2026-04-25T15:00:00.000Z') };
  const day2Morning: Entry = { id: 'd2m', mood: 5, createdAt: new Date('2026-04-26T05:00:00.000Z') };

  const result = groupByAlmatyDay([day1Morning, day1Evening, day2Morning]);

  assert.equal(result['2026-04-25']?.daySlot?.id, 'd1m');
  assert.equal(result['2026-04-25']?.eveningSlot?.id, 'd1e');
  assert.equal(result['2026-04-26']?.daySlot?.id, 'd2m');
  assert.equal(result['2026-04-26']?.eveningSlot, null);
});

test('should_split_entries_across_almaty_midnight_into_separate_days', () => {
  // 23:30 Almaty 25 апр = 18:30 UTC 25 апр
  const lateNight: Entry = { id: 'late', mood: 3, createdAt: new Date('2026-04-25T18:30:00.000Z') };
  // 00:30 Almaty 26 апр = 19:30 UTC 25 апр (UTC date одинаковая, но Almaty Day разные!)
  const justAfterMidnight: Entry = { id: 'next', mood: 4, createdAt: new Date('2026-04-25T19:30:00.000Z') };

  const result = groupByAlmatyDay([lateNight, justAfterMidnight]);

  assert.equal(result['2026-04-25']?.eveningSlot?.id, 'late');
  // 00:30 < 18:00 → day slot
  assert.equal(result['2026-04-26']?.daySlot?.id, 'next');
});
