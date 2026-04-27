import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateRiskStatus,
  type Severity,
  type TestSessionForRisk,
} from "./risk-status-calculator.js";

function session(
  overrides: Partial<TestSessionForRisk> & { severity: Severity | null },
): TestSessionForRisk {
  return {
    id: overrides.id ?? "session-id",
    testSlug: overrides.testSlug ?? "phq-a",
    testName: overrides.testName ?? "PHQ-A",
    severity: overrides.severity,
    flaggedItems: overrides.flaggedItems ?? null,
    completedAt: overrides.completedAt ?? new Date("2026-04-27T10:00:00.000Z"),
  };
}

test("no_test_sessions_yields_status_normal_and_reason_null", () => {
  const result = calculateRiskStatus([]);
  assert.deepEqual(result, { status: "normal", reason: null });
});

test("single_severe_session_yields_status_crisis_with_severe_reason", () => {
  const completedAt = new Date("2026-04-27T10:00:00.000Z");
  const result = calculateRiskStatus([
    session({
      id: "s1",
      testSlug: "phq-a",
      testName: "PHQ-A",
      severity: "severe",
      completedAt,
    }),
  ]);
  assert.deepEqual(result, {
    status: "crisis",
    reason: {
      kind: "severe_test_result",
      sessionId: "s1",
      testSlug: "phq-a",
      testName: "PHQ-A",
      completedAt,
    },
  });
});

test("severe_outranks_moderate_when_both_present_yields_crisis_with_severe_reason", () => {
  const severeAt = new Date("2026-04-20T10:00:00.000Z");
  const moderateAt = new Date("2026-04-25T10:00:00.000Z");
  const result = calculateRiskStatus([
    session({
      id: "moderate",
      testSlug: "gad-7",
      testName: "GAD-7",
      severity: "moderate",
      completedAt: moderateAt,
    }),
    session({
      id: "severe",
      testSlug: "phq-a",
      testName: "PHQ-A",
      severity: "severe",
      completedAt: severeAt,
    }),
  ]);
  assert.equal(result.status, "crisis");
  assert.equal(result.reason?.kind, "severe_test_result");
  assert.equal(result.reason?.sessionId, "severe");
});

test("mild_severity_with_flagged_items_yields_crisis_with_flagged_reason", () => {
  // Блокер пилота: ученик прошёл PHQ-A с suicidal-ответом на item 9,
  // но totalScore низкий → severity=mild. Без safety override Risk Status был бы normal.
  const completedAt = new Date("2026-04-27T10:00:00.000Z");
  const result = calculateRiskStatus([
    session({
      id: "phq-session",
      testSlug: "phq-a",
      testName: "PHQ-A",
      severity: "mild",
      flaggedItems: [
        { questionIndex: 8, reason: "suicidal_ideation" },
      ],
      completedAt,
    }),
  ]);
  assert.deepEqual(result, {
    status: "crisis",
    reason: {
      kind: "flagged_items",
      sessionId: "phq-session",
      testSlug: "phq-a",
      testName: "PHQ-A",
      completedAt,
    },
  });
});

test("severe_outranks_flagged_when_both_present_yields_severe_reason", () => {
  const result = calculateRiskStatus([
    session({
      id: "flagged",
      testSlug: "phq-a",
      testName: "PHQ-A",
      severity: "mild",
      flaggedItems: [{ questionIndex: 8, reason: "suicidal_ideation" }],
    }),
    session({
      id: "severe",
      testSlug: "rcads",
      testName: "RCADS",
      severity: "severe",
    }),
  ]);
  assert.equal(result.status, "crisis");
  assert.equal(result.reason?.kind, "severe_test_result");
  assert.equal(result.reason?.sessionId, "severe");
});

test("multiple_severe_sessions_yield_reason_pointing_at_most_recent", () => {
  const older = new Date("2026-04-10T10:00:00.000Z");
  const newer = new Date("2026-04-25T10:00:00.000Z");
  const result = calculateRiskStatus([
    session({ id: "old-severe", severity: "severe", completedAt: older }),
    session({ id: "new-severe", severity: "severe", completedAt: newer }),
  ]);
  assert.equal(result.reason?.sessionId, "new-severe");
  assert.deepEqual(result.reason?.completedAt, newer);
});

test("session_with_null_severity_and_no_flagged_items_is_ignored", () => {
  const result = calculateRiskStatus([
    session({ id: "legacy", severity: null }),
  ]);
  assert.deepEqual(result, { status: "normal", reason: null });
});

test("only_mild_and_minimal_sessions_yield_status_normal_and_reason_null", () => {
  const result = calculateRiskStatus([
    session({ id: "s1", severity: "minimal" }),
    session({ id: "s2", severity: "mild" }),
    session({ id: "s3", severity: "mild" }),
  ]);
  assert.deepEqual(result, { status: "normal", reason: null });
});

test("single_moderate_session_yields_status_attention_with_moderate_reason", () => {
  const completedAt = new Date("2026-04-27T10:00:00.000Z");
  const result = calculateRiskStatus([
    session({
      id: "s2",
      testSlug: "gad-7",
      testName: "GAD-7",
      severity: "moderate",
      completedAt,
    }),
  ]);
  assert.deepEqual(result, {
    status: "attention",
    reason: {
      kind: "moderate_test_result",
      sessionId: "s2",
      testSlug: "gad-7",
      testName: "GAD-7",
      completedAt,
    },
  });
});
