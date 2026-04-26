import { test } from "node:test";
import assert from "node:assert/strict";

import { buildLast7Days } from "./index.js";
import type { MoodCalendarDay } from "../types/index.js";

// Almaty = UTC+5 (фиксированный offset, без DST). 00:00 Almaty = 19:00 UTC предыдущего дня.

test("should_return_seven_days_ending_with_today_when_no_entries", () => {
  // 12:00 Almaty 26 апр = 07:00 UTC 26 апр
  const today = new Date("2026-04-26T07:00:00.000Z");
  const result = buildLast7Days([] as MoodCalendarDay[], today);
  assert.equal(result.length, 7);
  assert.equal(result[6]?.date, "2026-04-26");
  assert.equal(result[0]?.date, "2026-04-20");
  assert.equal(result[6]?.daySlotMood, null);
  assert.equal(result[6]?.eveningSlotMood, null);
});

test("should_use_almaty_day_when_utc_is_already_next_day_in_almaty", () => {
  // 00:30 Almaty 27 апр = 19:30 UTC 26 апр. Последний день — 27 апр Almaty.
  const today = new Date("2026-04-26T19:30:00.000Z");
  const result = buildLast7Days([] as MoodCalendarDay[], today);
  assert.equal(result[6]?.date, "2026-04-27");
  assert.equal(result[0]?.date, "2026-04-21");
});

test("should_attach_both_slots_for_day_with_data_and_keep_others_empty", () => {
  const today = new Date("2026-04-26T07:00:00.000Z");
  const entries: MoodCalendarDay[] = [
    { date: "2026-04-24", daySlotMood: 3, eveningSlotMood: 4 },
    { date: "2026-04-26", daySlotMood: 5, eveningSlotMood: null },
  ];
  const result = buildLast7Days(entries, today);
  // 2026-04-24 — index 2 (offset 2 от today)
  assert.equal(result[4]?.date, "2026-04-24");
  assert.equal(result[4]?.daySlotMood, 3);
  assert.equal(result[4]?.eveningSlotMood, 4);
  // today
  assert.equal(result[6]?.date, "2026-04-26");
  assert.equal(result[6]?.daySlotMood, 5);
  assert.equal(result[6]?.eveningSlotMood, null);
  // пустой день между
  assert.equal(result[5]?.date, "2026-04-25");
  assert.equal(result[5]?.daySlotMood, null);
  assert.equal(result[5]?.eveningSlotMood, null);
});

test("should_ignore_entries_outside_seven_day_window", () => {
  const today = new Date("2026-04-26T07:00:00.000Z");
  const entries: MoodCalendarDay[] = [
    { date: "2026-04-10", daySlotMood: 1, eveningSlotMood: 1 }, // вне окна
    { date: "2026-05-01", daySlotMood: 5, eveningSlotMood: 5 }, // в будущем
    { date: "2026-04-22", daySlotMood: 4, eveningSlotMood: null }, // в окне
  ];
  const result = buildLast7Days(entries, today);
  assert.equal(result.length, 7);
  const dates = result.map((d) => d.date);
  assert.deepEqual(dates, [
    "2026-04-20",
    "2026-04-21",
    "2026-04-22",
    "2026-04-23",
    "2026-04-24",
    "2026-04-25",
    "2026-04-26",
  ]);
  // в окне
  assert.equal(result[2]?.daySlotMood, 4);
  // вне окна не утекли
  for (const d of result) {
    if (d.date !== "2026-04-22") {
      assert.equal(d.daySlotMood, null);
      assert.equal(d.eveningSlotMood, null);
    }
  }
});

test("should_span_month_boundary_when_today_is_first_of_month", () => {
  // 12:00 Almaty 1 апр = 07:00 UTC 1 апр
  const today = new Date("2026-04-01T07:00:00.000Z");
  const entries: MoodCalendarDay[] = [
    { date: "2026-03-28", daySlotMood: 2, eveningSlotMood: null },
    { date: "2026-04-01", daySlotMood: 4, eveningSlotMood: null },
  ];
  const result = buildLast7Days(entries, today);
  assert.equal(result.length, 7);
  assert.equal(result[0]?.date, "2026-03-26");
  assert.equal(result[6]?.date, "2026-04-01");
  assert.equal(result[2]?.date, "2026-03-28");
  assert.equal(result[2]?.daySlotMood, 2);
});
