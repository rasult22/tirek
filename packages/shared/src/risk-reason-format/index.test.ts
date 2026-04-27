import { test } from "node:test";
import assert from "node:assert/strict";

import { formatRiskReason } from "./index.js";
import { ru } from "../i18n/ru.js";
import { kz } from "../i18n/kz.js";
import type { RiskReason } from "../api/index.js";

const baseReason = {
  sessionId: "s1",
  testSlug: "phq-a",
  testName: "PHQ-A",
  completedAt: "2026-04-27T08:00:00.000Z",
};

test("returns null when reason is null", () => {
  const result = formatRiskReason({ reason: null, t: ru, language: "ru" });
  assert.equal(result, null);
});

test("formats severe_test_result in ru with testName and short date", () => {
  const reason: RiskReason = { ...baseReason, kind: "severe_test_result" };
  const result = formatRiskReason({ reason, t: ru, language: "ru" });
  assert.ok(result);
  assert.match(result!, /Тяжёлый результат/);
  assert.match(result!, /PHQ-A/);
});

test("formats moderate_test_result in ru", () => {
  const reason: RiskReason = { ...baseReason, kind: "moderate_test_result" };
  const result = formatRiskReason({ reason, t: ru, language: "ru" });
  assert.ok(result);
  assert.match(result!, /Умеренный результат/);
  assert.match(result!, /PHQ-A/);
});

test("formats flagged_items in ru with testName", () => {
  const reason: RiskReason = { ...baseReason, kind: "flagged_items" };
  const result = formatRiskReason({ reason, t: ru, language: "ru" });
  assert.ok(result);
  assert.match(result!, /Тревожный сигнал/);
  assert.match(result!, /PHQ-A/);
});

test("formats severe_test_result in kz", () => {
  const reason: RiskReason = { ...baseReason, kind: "severe_test_result" };
  const result = formatRiskReason({ reason, t: kz, language: "kz" });
  assert.ok(result);
  assert.match(result!, /Ауыр нәтиже/);
  assert.match(result!, /PHQ-A/);
});

test("falls back to raw iso when completedAt is invalid", () => {
  const reason: RiskReason = {
    ...baseReason,
    kind: "severe_test_result",
    completedAt: "not-a-date",
  };
  const result = formatRiskReason({ reason, t: ru, language: "ru" });
  assert.ok(result);
  assert.match(result!, /not-a-date/);
});
