import { test } from "node:test";
import assert from "node:assert/strict";

import { validateIntervals, isDayOff } from "./index.js";

test("should_reject_interval_with_malformed_time_string", () => {
  const result = validateIntervals([{ start: "9:00", end: "17:00" }]);
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /format/i);
});

test("should_reject_interval_with_out_of_range_hour", () => {
  const result = validateIntervals([{ start: "25:00", end: "26:00" }]);
  assert.equal(result.ok, false);
});

test("should_reject_interval_with_out_of_range_minute", () => {
  const result = validateIntervals([{ start: "10:60", end: "11:00" }]);
  assert.equal(result.ok, false);
});

test("should_reject_interval_where_start_equals_end", () => {
  const result = validateIntervals([{ start: "13:00", end: "13:00" }]);
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /end/i);
});

test("should_reject_interval_where_start_is_after_end", () => {
  const result = validateIntervals([{ start: "17:00", end: "13:00" }]);
  assert.equal(result.ok, false);
});

test("should_reject_overlapping_intervals_in_order", () => {
  const result = validateIntervals([
    { start: "09:00", end: "12:00" },
    { start: "11:00", end: "14:00" },
  ]);
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /overlap/i);
});

test("should_reject_overlapping_intervals_given_out_of_order", () => {
  const result = validateIntervals([
    { start: "14:00", end: "17:00" },
    { start: "16:00", end: "18:00" },
  ]);
  assert.equal(result.ok, false);
});

test("should_reject_fully_contained_overlapping_intervals", () => {
  const result = validateIntervals([
    { start: "09:00", end: "17:00" },
    { start: "10:00", end: "11:00" },
  ]);
  assert.equal(result.ok, false);
});

test("should_accept_empty_list_as_valid_day_off", () => {
  assert.deepEqual(validateIntervals([]), { ok: true });
});

test("should_accept_multiple_sorted_non_overlapping_intervals", () => {
  assert.deepEqual(
    validateIntervals([
      { start: "09:00", end: "11:00" },
      { start: "14:00", end: "17:00" },
    ]),
    { ok: true },
  );
});

test("should_accept_touching_intervals_where_end_equals_next_start", () => {
  assert.deepEqual(
    validateIntervals([
      { start: "09:00", end: "12:00" },
      { start: "12:00", end: "15:00" },
    ]),
    { ok: true },
  );
});

test("isDayOff_returns_true_for_empty_intervals", () => {
  assert.equal(isDayOff([]), true);
});

test("isDayOff_returns_false_when_at_least_one_interval", () => {
  assert.equal(isDayOff([{ start: "09:00", end: "17:00" }]), false);
});
