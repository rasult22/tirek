import { test } from "node:test";
import assert from "node:assert/strict";

import { buildStudentContextPure } from "./build-student-context.js";

test("recent diagnostic tests appear by name and completion date — no severity, no scores", () => {
  const completedAt = new Date("2026-04-20T12:30:00.000Z");

  const { context } = buildStudentContextPure({
    user: { name: "Айдана", grade: 8, classLetter: "Б", language: "ru" },
    recentMoods: [],
    recentTests: [
      {
        testName: "PHQ-9 для подростков",
        completedAt,
        totalScore: 22,
        maxScore: 27,
        severity: "severe",
      },
    ],
  });

  assert.ok(
    context.includes("PHQ-9 для подростков"),
    `expected test name in context, got:\n${context}`,
  );
  assert.ok(
    context.includes("2026-04-20") || context.includes("20.04.2026"),
    `expected completion date in context, got:\n${context}`,
  );
  assert.ok(!context.includes("22"), `score 22 leaked: ${context}`);
  assert.ok(!context.includes("27"), `maxScore 27 leaked: ${context}`);
  assert.ok(
    !/severe/i.test(context),
    `severity leaked: ${context}`,
  );
});

test("kz language → response language label is казахский, ru → русский", () => {
  const kz = buildStudentContextPure({
    user: { name: "X", grade: 9, classLetter: "А", language: "kz" },
    recentMoods: [],
    recentTests: [],
  });
  assert.ok(kz.context.includes("казахский"));
  assert.equal(kz.language, "kz");

  const ru = buildStudentContextPure({
    user: { name: "X", grade: 9, classLetter: "А", language: "ru" },
    recentMoods: [],
    recentTests: [],
  });
  assert.ok(ru.context.includes("русский"));
  assert.equal(ru.language, "ru");
});

test("no completed tests → no test section in context", () => {
  const { context } = buildStudentContextPure({
    user: { name: "X", grade: 9, classLetter: "А", language: "ru" },
    recentMoods: [],
    recentTests: [
      { testName: "Brewing", completedAt: null, totalScore: 5, maxScore: 10, severity: "mild" },
    ],
  });
  assert.ok(!context.includes("Brewing"));
  assert.ok(!context.includes("Недавние тесты"));
});

test("context has no session mode line — single 'Поговорить с Тирек' button replaced mode selection", () => {
  const { context } = buildStudentContextPure({
    user: { name: "X", grade: 9, classLetter: "А", language: "ru" },
    recentMoods: [],
    recentTests: [],
  });
  assert.ok(
    !/Режим сессии/i.test(context),
    `mode line leaked into context:\n${context}`,
  );
});
