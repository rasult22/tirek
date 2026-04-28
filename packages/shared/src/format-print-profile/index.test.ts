import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPrintProfile, renderPrintProfileHtml } from "./index.js";
import type { DiagnosticSession, MoodEntry } from "../types/index.js";

type TestResultInput = DiagnosticSession & {
  testName?: string | null;
  testSlug?: string | null;
};

function moodEntry(
  createdAtIso: string,
  mood: 1 | 2 | 3 | 4 | 5,
): MoodEntry {
  return {
    id: "m-" + createdAtIso,
    userId: "u",
    mood,
    energy: null,
    sleepQuality: null,
    stressLevel: null,
    note: null,
    factors: null,
    createdAt: createdAtIso,
  };
}

// Almaty = UTC+5 (фиксированный offset). 00:00 Almaty = 19:00 UTC предыдущего дня.

test("header_should_contain_school_psychologist_and_today_in_almaty", () => {
  // 12:00 Almaty 28 апр = 07:00 UTC 28 апр
  const today = new Date("2026-04-28T07:00:00.000Z");

  const result = buildPrintProfile({
    schoolName: "Школа №1",
    psychologistName: "Иванова А.Б.",
    student: {
      name: "Петров П.П.",
      grade: 8,
      classLetter: "А",
    },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });

  assert.equal(result.header.schoolName, "Школа №1");
  assert.equal(result.header.psychologistName, "Иванова А.Б.");
  assert.equal(result.header.generatedAt, "2026-04-28");
});

test("student_section_should_combine_grade_and_class_letter", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const result = buildPrintProfile({
    schoolName: "Школа №1",
    psychologistName: "Иванова А.Б.",
    student: { name: "Петров П.П.", grade: 8, classLetter: "А" },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });

  assert.equal(result.student.name, "Петров П.П.");
  assert.equal(result.student.classLabel, "8А");
});

test("mood_should_return_thirty_day_window_ending_with_today_in_almaty", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });

  assert.equal(result.mood.length, 30);
  assert.equal(result.mood[29]?.date, "2026-04-28");
  assert.equal(result.mood[0]?.date, "2026-03-30");
  for (const day of result.mood) {
    assert.equal(day.average, null);
  }
});

test("mood_should_aggregate_entries_per_almaty_day_and_drop_outside_window", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const entries: MoodEntry[] = [
    // 2026-04-28 Almaty: две записи, среднее = 4.5
    moodEntry("2026-04-28T05:00:00.000Z", 5), // 10:00 Almaty
    moodEntry("2026-04-28T15:00:00.000Z", 4), // 20:00 Almaty
    // 2026-04-15 Almaty: одна запись = 3
    moodEntry("2026-04-15T10:00:00.000Z", 3),
    // 2026-03-01: вне 30-дневного окна
    moodEntry("2026-03-01T10:00:00.000Z", 1),
  ];
  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: entries,
    testResults: [],
    today,
    lang: "ru",
  });

  assert.equal(result.mood.length, 30);
  assert.equal(result.mood[29]?.date, "2026-04-28");
  assert.equal(result.mood[29]?.average, 4.5);
  // 2026-04-15 — индекс 29-13=16
  assert.equal(result.mood[16]?.date, "2026-04-15");
  assert.equal(result.mood[16]?.average, 3);
  // Записи вне окна не утекли
  for (const day of result.mood) {
    if (day.date !== "2026-04-28" && day.date !== "2026-04-15") {
      assert.equal(day.average, null);
    }
  }
});

test("mood_should_use_almaty_day_when_utc_already_next_day", () => {
  // 00:30 Almaty 28 апр = 19:30 UTC 27 апр. Запись в 19:30 UTC должна попасть в день 28 апр Almaty.
  const today = new Date("2026-04-27T19:30:00.000Z");
  const entries: MoodEntry[] = [moodEntry("2026-04-27T19:30:00.000Z", 5)];
  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: entries,
    testResults: [],
    today,
    lang: "ru",
  });
  assert.equal(result.mood[29]?.date, "2026-04-28");
  assert.equal(result.mood[29]?.average, 5);
});

test("tests_should_include_only_completed_sessions_sorted_desc", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const sessions: TestResultInput[] = [
    {
      id: "s1",
      userId: "u",
      testId: "phq9",
      startedAt: "2026-04-10T10:00:00.000Z",
      completedAt: "2026-04-10T10:05:00.000Z",
      totalScore: 12,
      maxScore: 27,
      severity: "moderate",
      testName: "PHQ-9",
    },
    {
      id: "s2",
      userId: "u",
      testId: "gad7",
      startedAt: "2026-04-25T10:00:00.000Z",
      completedAt: "2026-04-25T10:04:00.000Z",
      totalScore: 5,
      maxScore: 21,
      severity: "mild",
      testName: "GAD-7",
    },
    {
      id: "s3-incomplete",
      userId: "u",
      testId: "phq9",
      startedAt: "2026-04-26T10:00:00.000Z",
      completedAt: null,
      totalScore: null,
      maxScore: null,
      severity: null,
      testName: "PHQ-9",
    },
  ];

  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: sessions,
    today,
    lang: "ru",
  });

  // Только завершённые
  assert.equal(result.tests.length, 2);
  // Сорт убыв: GAD-7 (25 апр) первой, PHQ-9 (10 апр) — второй
  assert.equal(result.tests[0]?.testName, "GAD-7");
  assert.equal(result.tests[0]?.completedAt, "2026-04-25T10:04:00.000Z");
  assert.equal(result.tests[0]?.severity, "mild");
  assert.equal(result.tests[1]?.testName, "PHQ-9");
  assert.equal(result.tests[1]?.severity, "moderate");
});

test("tests_should_omit_score_fields_to_avoid_leaking_numeric_results", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [
      {
        id: "s1",
        userId: "u",
        testId: "phq9",
        startedAt: "2026-04-10T10:00:00.000Z",
        completedAt: "2026-04-10T10:05:00.000Z",
        totalScore: 12,
        maxScore: 27,
        severity: "moderate",
        testName: "PHQ-9",
      },
    ] as TestResultInput[],
    today,
    lang: "ru",
  });

  const t = result.tests[0]!;
  assert.equal((t as unknown as Record<string, unknown>).totalScore, undefined);
  assert.equal((t as unknown as Record<string, unknown>).maxScore, undefined);
});

test("tests_output_keys_should_be_exactly_testName_completedAt_severity", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  // Загрязнённый вход: сюда подкидываем то, чего не должно быть в выходе.
  const dirtyInput = {
    id: "s1",
    userId: "u",
    testId: "phq9",
    startedAt: "2026-04-10T10:00:00.000Z",
    completedAt: "2026-04-10T10:05:00.000Z",
    totalScore: 12,
    maxScore: 27,
    severity: "moderate" as const,
    testName: "PHQ-9",
    interpretation: "lorem ipsum AI interpretation",
    recommendation: "do thing",
    aiReport: { summary: "blob" },
  };

  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [dirtyInput] as unknown as TestResultInput[],
    today,
    lang: "ru",
  });

  const keys = Object.keys(result.tests[0]!).sort();
  assert.deepEqual(keys, ["completedAt", "severity", "testName"]);
});

test("renderHtml_should_include_student_name_and_class_label", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const profile = buildPrintProfile({
    schoolName: "Школа №1",
    psychologistName: "П.",
    student: { name: "Петров П.П.", grade: 8, classLetter: "А" },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });
  const html = renderPrintProfileHtml(profile, "ru");

  assert.match(html, /Петров П\.П\./);
  assert.match(html, /8А/);
});

test("renderHtml_should_render_tests_with_ru_severity_labels_and_no_scores", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const profile = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [
      {
        id: "s1",
        userId: "u",
        testId: "phq9",
        startedAt: "2026-04-25T10:00:00.000Z",
        completedAt: "2026-04-25T10:05:00.000Z",
        totalScore: 23,
        maxScore: 27,
        severity: "severe",
        testName: "PHQ-9",
      },
    ] as TestResultInput[],
    today,
    lang: "ru",
  });
  const html = renderPrintProfileHtml(profile, "ru");

  assert.match(html, /PHQ-9/);
  assert.match(html, /Тяжёлый/);
  assert.match(html, /2026-04-25/);
  // Не утекли баллы
  assert.equal(html.includes("23"), false);
  assert.equal(html.includes("27"), false);
});

test("renderHtml_should_include_svg_sparkline_with_one_point_per_day_with_data", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  // 30-дневное окно: с 2026-03-30 по 2026-04-28. Возьмём 3 дня с данными.
  const moodHistory: MoodEntry[] = [
    moodEntry("2026-04-28T05:00:00.000Z", 5),
    moodEntry("2026-04-15T10:00:00.000Z", 3),
    moodEntry("2026-04-01T10:00:00.000Z", 1),
  ];
  const profile = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory,
    testResults: [],
    today,
    lang: "ru",
  });
  const html = renderPrintProfileHtml(profile, "ru");

  assert.match(html, /<svg/);
  assert.match(html, /<polyline/);
  // 3 точки = 3 пары координат "x,y"
  const polylineMatch = html.match(/<polyline[^>]*points="([^"]*)"/);
  assert.ok(polylineMatch, "polyline points attribute should be present");
  const points = polylineMatch![1].trim().split(/\s+/).filter(Boolean);
  assert.equal(points.length, 3);
});

test("renderHtml_should_render_empty_sparkline_when_no_mood_data", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const profile = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });
  const html = renderPrintProfileHtml(profile, "ru");

  assert.match(html, /<svg/);
  // Если точек нет — либо нет polyline, либо points=""
  const polylineMatch = html.match(/<polyline[^>]*points="([^"]*)"/);
  if (polylineMatch) {
    assert.equal(polylineMatch[1].trim(), "");
  }
});

test("renderHtml_should_use_kz_severity_labels_when_lang_is_kz", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const profile = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [
      {
        id: "s1",
        userId: "u",
        testId: "phq9",
        startedAt: "2026-04-25T10:00:00.000Z",
        completedAt: "2026-04-25T10:05:00.000Z",
        totalScore: 23,
        maxScore: 27,
        severity: "severe",
        testName: "PHQ-9",
      },
    ] as TestResultInput[],
    today,
    lang: "kz",
  });
  const html = renderPrintProfileHtml(profile, "kz");

  assert.match(html, /Ауыр/);
});

test("renderHtml_should_include_school_psychologist_and_date_in_header", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const profile = buildPrintProfile({
    schoolName: "Школа №1",
    psychologistName: "Иванова А.Б.",
    student: { name: "Петров П.П.", grade: 8, classLetter: "А" },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });
  const html = renderPrintProfileHtml(profile, "ru");

  assert.match(html, /Школа №1/);
  assert.match(html, /Иванова А\.Б\./);
  assert.match(html, /2026-04-28/);
  // Это HTML-документ с одной страницей
  assert.match(html, /<html[\s\S]*<\/html>/);
});

test("tests_should_fallback_to_slug_or_testId_when_name_missing", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");
  const result = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "У.", grade: null, classLetter: null },
    moodHistory: [],
    testResults: [
      {
        id: "a",
        userId: "u",
        testId: "test-uuid-no-name",
        startedAt: "2026-04-10T10:00:00.000Z",
        completedAt: "2026-04-10T10:05:00.000Z",
        totalScore: 1,
        maxScore: 10,
        severity: "minimal",
      },
      {
        id: "b",
        userId: "u",
        testId: "test-uuid-with-slug",
        startedAt: "2026-04-12T10:00:00.000Z",
        completedAt: "2026-04-12T10:05:00.000Z",
        totalScore: 1,
        maxScore: 10,
        severity: "minimal",
        testSlug: "phq9",
      },
    ] as TestResultInput[],
    today,
    lang: "ru",
  });

  // b завершён позже → первый
  assert.equal(result.tests[0]?.testName, "phq9"); // fallback на slug
  assert.equal(result.tests[1]?.testName, "test-uuid-no-name"); // fallback на testId
});

test("student_section_classLabel_should_be_null_when_grade_or_letter_missing", () => {
  const today = new Date("2026-04-28T07:00:00.000Z");

  const noGrade = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "Без класса", grade: null, classLetter: "А" },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });
  assert.equal(noGrade.student.classLabel, null);

  const noLetter = buildPrintProfile({
    schoolName: null,
    psychologistName: "П.",
    student: { name: "Без буквы", grade: 8, classLetter: null },
    moodHistory: [],
    testResults: [],
    today,
    lang: "ru",
  });
  assert.equal(noLetter.student.classLabel, null);
});
