import { test } from "node:test";
import assert from "node:assert/strict";

import { computeScore } from "./test-scoring-engine.js";
import { testDefinitions } from "../../../../shared/src/constants/test-definitions.js";

function buildScoringRules(slug: keyof typeof testDefinitions) {
  const def = testDefinitions[slug];
  const optionValues = def.options.map((o) => o.value);
  return {
    thresholds: def.scoringRules,
    reverseItems: def.reverseItems,
    maxScore: def.maxScore,
    maxOptionValue: Math.max(...optionValues),
    minOptionValue: Math.min(...optionValues),
  };
}

test("phq_a_with_all_zero_answers_yields_total_score_0_and_minimal_severity", () => {
  const def = testDefinitions["phq-a"];
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("phq-a"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 0);
  assert.equal(result.maxScore, 27);
  assert.equal(result.severity, "minimal");
  assert.deepEqual(result.flaggedItems, []);
});

test("phq_a_item_8_with_answer_1_is_flagged_as_suicidal_ideation", () => {
  const def = testDefinitions["phq-a"];
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: q.index === 8 ? 1 : 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("phq-a"),
    questions: def.questions,
    flaggedRules: [
      { questionIndex: 8, minAnswer: 1, reason: "suicidal_ideation" },
    ],
  });

  assert.equal(result.flaggedItems.length, 1);
  assert.deepEqual(result.flaggedItems[0], {
    questionIndex: 8,
    answer: 1,
    reason: "suicidal_ideation",
  });
});

test("phq_a_item_8_with_answer_0_is_not_flagged_below_threshold", () => {
  const def = testDefinitions["phq-a"];
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("phq-a"),
    questions: def.questions,
    flaggedRules: [
      { questionIndex: 8, minAnswer: 1, reason: "suicidal_ideation" },
    ],
  });

  assert.deepEqual(result.flaggedItems, []);
});

// GAD-7 thresholds: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe.
// Each row exercises the boundary: target totalScore -> expected severity.
const gadBoundaryMatrix = [
  { totalScore: 0, expected: "minimal" },
  { totalScore: 4, expected: "minimal" },
  { totalScore: 5, expected: "mild" },
  { totalScore: 9, expected: "mild" },
  { totalScore: 10, expected: "moderate" },
  { totalScore: 14, expected: "moderate" },
  { totalScore: 15, expected: "severe" },
  { totalScore: 21, expected: "severe" },
] as const;

for (const { totalScore, expected } of gadBoundaryMatrix) {
  test(`gad_7_total_score_${totalScore}_yields_severity_${expected}`, () => {
    const def = testDefinitions["gad-7"];
    // Build answers that sum to `totalScore`. GAD-7 has 7 questions with values 0-3.
    // Strategy: fill with 3s until we run out of budget, then top up with the remainder.
    const answers = def.questions.map((q) => ({
      questionIndex: q.index,
      answer: 0,
    }));
    let remaining = totalScore;
    for (let i = 0; i < answers.length && remaining > 0; i++) {
      const value = Math.min(3, remaining);
      answers[i] = { questionIndex: answers[i].questionIndex, answer: value };
      remaining -= value;
    }

    const result = computeScore({
      answers,
      scoringRules: buildScoringRules("gad-7"),
      questions: def.questions,
    });

    assert.equal(result.totalScore, totalScore);
    assert.equal(result.severity, expected);
  });
}

test("rosenberg_reverse_items_invert_answer_so_optimal_replies_yield_max_score", () => {
  // Rosenberg: options 0..3. reverseItems = [2, 4, 7, 8, 9].
  // "Optimal" reply for self-esteem = high agreement on direct items (3),
  // low agreement on reverse items (0). Without reverse handling totalScore would be 5*3=15.
  // With reverse handling each reverse 0 becomes 3 → totalScore 30 (max).
  const def = testDefinitions.rosenberg;
  const reverseSet = new Set<number>(def.reverseItems);
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: reverseSet.has(q.index) ? 0 : 3,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("rosenberg"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 30);
  assert.equal(result.severity, "minimal");
});

test("rosenberg_reverse_items_invert_answer_so_pessimistic_replies_yield_zero", () => {
  // Pessimistic: 0 on direct items, 3 on reverse items.
  // Reverse 3 → 0+3-3=0. Direct 0. totalScore=0 → severity=severe (Критически низкая).
  const def = testDefinitions.rosenberg;
  const reverseSet = new Set<number>(def.reverseItems);
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: reverseSet.has(q.index) ? 3 : 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("rosenberg"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 0);
  assert.equal(result.severity, "severe");
});

test("stai_uses_one_based_option_scale_so_reverse_items_use_min_plus_max_formula", () => {
  // STAI: options 1..4 (1-based scale, regression bug from PLAN.md P2-7).
  // 40 questions; 17 reverse items.
  // Strategy: answer 1 (lowest anxiety) on every item.
  // Direct items contribute 1 each. Reverse items: 1 + 4 - 1 = 4 each.
  // 23 direct * 1 + 17 reverse * 4 = 23 + 68 = 91 → severity "mild" (Умеренная, 80-99).
  const def = testDefinitions.stai;
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: 1,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("stai"),
    questions: def.questions,
  });

  const directCount = def.questions.length - def.reverseItems.length;
  const reverseCount = def.reverseItems.length;
  const expected = directCount * 1 + reverseCount * (1 + 4 - 1);
  assert.equal(result.totalScore, expected);
  assert.equal(result.totalScore, 91);
  assert.equal(result.severity, "mild");
});

test("stai_min_score_40_when_every_answer_is_optimal_for_low_anxiety", () => {
  // Optimal for low anxiety: 1 on direct items, 4 on reverse items.
  // Direct 1 + Reverse: 1+4-4 = 1. Total = 40 (= 40 questions * 1) → minimal.
  const def = testDefinitions.stai;
  const reverseSet = new Set<number>(def.reverseItems);
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: reverseSet.has(q.index) ? 4 : 1,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("stai"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 40);
  assert.equal(result.severity, "minimal");
});

test("scared_panic_attack_items_29_and_32_with_answer_2_yield_two_flagged_items", () => {
  const def = testDefinitions.scared;
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: q.index === 29 || q.index === 32 ? 2 : 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("scared"),
    questions: def.questions,
    flaggedRules: [
      { questionIndex: 29, minAnswer: 2, reason: "panic_attack" },
      { questionIndex: 32, minAnswer: 2, reason: "panic_attack_school" },
    ],
  });

  assert.equal(result.flaggedItems.length, 2);
  const reasons = result.flaggedItems.map((f) => f.reason).sort();
  assert.deepEqual(reasons, ["panic_attack", "panic_attack_school"]);
});

test("pss_10_reverse_items_3_4_6_7_invert_correctly_on_zero_based_scale", () => {
  // PSS-10 options 0..4. reverseItems = [3, 4, 6, 7].
  // All answers = 0. Direct items contribute 0; reverse items contribute 0+4-0=4.
  // 4 reverse * 4 = 16 → severity "mild" (Умеренный, 14-19).
  const def = testDefinitions["pss-10"];
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: 0,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("pss-10"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 16);
  assert.equal(result.severity, "mild");
});

test("null_answers_are_skipped_and_do_not_contribute_to_total_score", () => {
  const def = testDefinitions["gad-7"];
  // Two of seven answers are null; remaining five are 2 each → totalScore=10 → moderate.
  const answers = def.questions.map((q, i) => ({
    questionIndex: q.index,
    answer: i < 2 ? null : 2,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("gad-7"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 10);
  assert.equal(result.severity, "moderate");
});

test("empty_answers_array_yields_total_score_0_and_lowest_threshold_severity", () => {
  const def = testDefinitions["phq-a"];
  const result = computeScore({
    answers: [],
    scoringRules: buildScoringRules("phq-a"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 0);
  assert.equal(result.severity, "minimal");
});

// Smoke matrix for the remaining seeded tests: every test should sum max-value answers
// (with reverse handling) and resolve to its top-band severity.
const maxScoreMatrix: Array<{
  slug: keyof typeof testDefinitions;
  expectedTotalScore: number;
  expectedSeverity: "minimal" | "mild" | "moderate" | "severe";
}> = [
  { slug: "bullying", expectedTotalScore: 60, expectedSeverity: "severe" },
  // academic-burnout: 12 direct * 4 + 4 reverse * (0+4-4=0) = 48 → severe
  { slug: "academic-burnout", expectedTotalScore: 48, expectedSeverity: "severe" },
  // eysenck-self-esteem: 8 direct * 3 + 10 reverse * (0+3-3=0) = 24 → mild (Нормальная 24-35)
  { slug: "eysenck-self-esteem", expectedTotalScore: 24, expectedSeverity: "mild" },
];

for (const { slug, expectedTotalScore, expectedSeverity } of maxScoreMatrix) {
  test(`${slug.replace(/-/g, "_")}_with_all_max_value_answers_yields_total_${expectedTotalScore}_severity_${expectedSeverity}`, () => {
    const def = testDefinitions[slug];
    const answers = def.questions.map((q) => ({
      questionIndex: q.index,
      answer: Math.max(...def.options.map((o) => o.value)),
    }));

    const result = computeScore({
      answers,
      scoringRules: buildScoringRules(slug),
      questions: def.questions,
    });

    assert.equal(result.totalScore, expectedTotalScore);
    assert.equal(result.severity, expectedSeverity);
  });
}

test("phq_a_with_all_max_answers_yields_total_score_27_and_severe_severity", () => {
  const def = testDefinitions["phq-a"];
  const answers = def.questions.map((q) => ({
    questionIndex: q.index,
    answer: 3,
  }));

  const result = computeScore({
    answers,
    scoringRules: buildScoringRules("phq-a"),
    questions: def.questions,
  });

  assert.equal(result.totalScore, 27);
  assert.equal(result.severity, "severe");
});
