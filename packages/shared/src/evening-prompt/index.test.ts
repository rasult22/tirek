import { test } from "node:test";
import assert from "node:assert/strict";

import {
  nextEveningPromptAt,
  nextDayEveningPromptAt,
  shouldShowEveningPrompt,
  isEveningSlot,
} from "./index.js";

// Almaty = UTC+5, фиксированное смещение (без DST).
// 20:00 Almaty == 15:00 UTC.

test("nextEveningPromptAt: до 20:00 Almaty → сегодня в 20:00 Almaty", () => {
  // 2026-04-26T10:00:00Z = 15:00 Almaty (до 20:00)
  const now = new Date("2026-04-26T10:00:00Z");
  const expected = new Date("2026-04-26T15:00:00Z"); // 20:00 Almaty того же дня
  assert.equal(nextEveningPromptAt(now).toISOString(), expected.toISOString());
});

test("nextEveningPromptAt: после 20:00 Almaty → завтра в 20:00 Almaty", () => {
  // 2026-04-26T16:00:00Z = 21:00 Almaty (после 20:00)
  const now = new Date("2026-04-26T16:00:00Z");
  const expected = new Date("2026-04-27T15:00:00Z"); // 20:00 Almaty следующего дня
  assert.equal(nextEveningPromptAt(now).toISOString(), expected.toISOString());
});

test("nextEveningPromptAt: ровно 20:00 Almaty → завтра (текущий момент уже наступил)", () => {
  // Ровно 20:00 Almaty → планируем на завтра, чтобы не было дубля с уже сработавшим уведомлением
  const now = new Date("2026-04-26T15:00:00Z"); // 20:00 Almaty
  const expected = new Date("2026-04-27T15:00:00Z");
  assert.equal(nextEveningPromptAt(now).toISOString(), expected.toISOString());
});

test("nextEveningPromptAt: 02:00 Almaty (= 21:00 UTC предыдущего календарного дня) → 20:00 Almaty того же Almaty-дня (~через 18ч)", () => {
  // 2026-04-26T21:00:00Z = 02:00 Almaty 2026-04-27. Следующий 20:00 Almaty = 2026-04-27T15:00:00Z.
  const now = new Date("2026-04-26T21:00:00Z");
  const expected = new Date("2026-04-27T15:00:00Z");
  assert.equal(nextEveningPromptAt(now).toISOString(), expected.toISOString());
});

// ─── shouldShowEveningPrompt ──────────────────────────────────────────

test("shouldShowEveningPrompt: нет evening slot записи сегодня → показать", () => {
  assert.equal(shouldShowEveningPrompt({ hasEveningSlotToday: false }), true);
});

test("shouldShowEveningPrompt: уже есть evening slot запись сегодня → не показывать", () => {
  assert.equal(shouldShowEveningPrompt({ hasEveningSlotToday: true }), false);
});

// ─── isEveningSlot ────────────────────────────────────────────────────

test("isEveningSlot: 17:59 Almaty → false (day slot)", () => {
  // 17:59 Almaty = 12:59 UTC
  assert.equal(isEveningSlot(new Date("2026-04-26T12:59:00Z")), false);
});

test("isEveningSlot: 18:00 Almaty → true (граница включительно — evening)", () => {
  // 18:00 Almaty = 13:00 UTC
  assert.equal(isEveningSlot(new Date("2026-04-26T13:00:00Z")), true);
});

test("isEveningSlot: 23:30 Almaty → true (evening)", () => {
  assert.equal(isEveningSlot(new Date("2026-04-26T18:30:00Z")), true);
});

test("isEveningSlot: 00:30 Almaty (= 19:30 UTC предыдущего календарного дня) → false (day slot нового дня)", () => {
  // 19:30 UTC = 00:30 Almaty следующего дня. Это Day Slot нового Almaty-дня.
  assert.equal(isEveningSlot(new Date("2026-04-26T19:30:00Z")), false);
});

test("isEveningSlot: 12:00 Almaty (= 07:00 UTC) → false (day slot)", () => {
  assert.equal(isEveningSlot(new Date("2026-04-26T07:00:00Z")), false);
});

// ─── nextDayEveningPromptAt ───────────────────────────────────────────

test("nextDayEveningPromptAt: 19:00 Almaty (= 14:00 UTC) → завтра 20:00 Almaty (не сегодня)", () => {
  // Студент сделал Evening check-in в 19:00; сегодня 20:00 ещё впереди, но пуш не нужен — завтра.
  const checkedInAt = new Date("2026-04-26T14:00:00Z");
  const expected = new Date("2026-04-27T15:00:00Z"); // 20:00 Almaty следующего Almaty-дня
  assert.equal(nextDayEveningPromptAt(checkedInAt).toISOString(), expected.toISOString());
});

test("nextDayEveningPromptAt: 21:00 Almaty (= 16:00 UTC, после 20:00) → завтра 20:00 Almaty", () => {
  const checkedInAt = new Date("2026-04-26T16:00:00Z");
  const expected = new Date("2026-04-27T15:00:00Z");
  assert.equal(nextDayEveningPromptAt(checkedInAt).toISOString(), expected.toISOString());
});
