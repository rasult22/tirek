import type {
  DiagnosticSession,
  MoodEntry,
  Severity,
} from "../types/index.js";

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MOOD_WINDOW_DAYS = 30;

function almatyDay(instant: Date): string {
  const inAlmaty = new Date(instant.getTime() + ALMATY_OFFSET_MS);
  const year = inAlmaty.getUTCFullYear();
  const month = inAlmaty.getUTCMonth() + 1;
  const day = inAlmaty.getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDay(day: string, deltaDays: number): string {
  const [y, m, d] = day.split("-").map((p) => Number.parseInt(p, 10));
  const utcMidnight = Date.UTC(y, m - 1, d) + deltaDays * DAY_MS;
  const shifted = new Date(utcMidnight);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function buildMoodWindow(
  entries: MoodEntry[],
  today: Date,
): PrintProfileMoodDay[] {
  const sumByDay = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    const day = almatyDay(new Date(e.createdAt));
    const cur = sumByDay.get(day) ?? { sum: 0, count: 0 };
    cur.sum += e.mood;
    cur.count += 1;
    sumByDay.set(day, cur);
  }

  const todayDay = almatyDay(today);
  const result: PrintProfileMoodDay[] = [];
  for (let offset = MOOD_WINDOW_DAYS - 1; offset >= 0; offset--) {
    const date = shiftDay(todayDay, -offset);
    const agg = sumByDay.get(date);
    result.push({
      date,
      average: agg ? agg.sum / agg.count : null,
    });
  }
  return result;
}

export type PrintProfileLang = "ru" | "kz";

export interface PrintProfileStudentInput {
  name: string;
  grade: number | null;
  classLetter: string | null;
}

export interface BuildPrintProfileInput {
  schoolName: string | null;
  psychologistName: string;
  student: PrintProfileStudentInput;
  moodHistory: MoodEntry[];
  testResults: PrintProfileTestInput[];
  today: Date;
  lang: PrintProfileLang;
}

export interface PrintProfileHeader {
  schoolName: string | null;
  psychologistName: string;
  generatedAt: string;
}

export interface PrintProfileStudent {
  name: string;
  classLabel: string | null;
}

export type PrintProfileTestInput = DiagnosticSession & {
  testName?: string | null;
  testSlug?: string | null;
};

export interface PrintProfileTest {
  testName: string;
  completedAt: string;
  severity: Severity;
}

export interface PrintProfileMoodDay {
  date: string;
  average: number | null;
}

export interface PrintProfile {
  header: PrintProfileHeader;
  student: PrintProfileStudent;
  mood: PrintProfileMoodDay[];
  tests: PrintProfileTest[];
}

function classLabel(
  grade: number | null,
  classLetter: string | null,
): string | null {
  if (grade == null || classLetter == null) return null;
  return `${grade}${classLetter}`;
}

function buildTests(input: PrintProfileTestInput[]): PrintProfileTest[] {
  return input
    .filter(
      (s): s is PrintProfileTestInput & {
        completedAt: string;
        severity: Severity;
      } => s.completedAt != null && s.severity != null,
    )
    .map((s) => ({
      testName: s.testName ?? s.testSlug ?? s.testId,
      completedAt: s.completedAt,
      severity: s.severity,
    }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

const SEVERITY_LABELS: Record<PrintProfileLang, Record<Severity, string>> = {
  ru: {
    minimal: "Минимальный",
    mild: "Лёгкий",
    moderate: "Умеренный",
    severe: "Тяжёлый",
  },
  kz: {
    minimal: "Минималды",
    mild: "Жеңіл",
    moderate: "Орташа",
    severe: "Ауыр",
  },
};

const SPARKLINE_W = 600;
const SPARKLINE_H = 80;
const MOOD_MIN = 1;
const MOOD_MAX = 5;

function sparklinePoints(mood: PrintProfileMoodDay[]): string {
  const n = mood.length;
  if (n === 0) return "";
  const xStep = n > 1 ? SPARKLINE_W / (n - 1) : 0;
  const points: string[] = [];
  mood.forEach((day, i) => {
    if (day.average == null) return;
    const x = i * xStep;
    // 1 → bottom (H), 5 → top (0)
    const y =
      SPARKLINE_H -
      ((day.average - MOOD_MIN) / (MOOD_MAX - MOOD_MIN)) * SPARKLINE_H;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  });
  return points.join(" ");
}

export function renderPrintProfileHtml(
  profile: PrintProfile,
  lang: PrintProfileLang,
): string {
  const { header, student, mood, tests } = profile;
  const school = header.schoolName ?? "—";
  const classLabelStr = student.classLabel ? ` · ${student.classLabel}` : "";
  const severityLabel = SEVERITY_LABELS[lang];

  const points = sparklinePoints(mood);

  const testsRows = tests
    .map((t) => {
      const date = t.completedAt.slice(0, 10);
      return `<tr><td>${escapeHtml(t.testName)}</td><td>${escapeHtml(
        date,
      )}</td><td>${escapeHtml(severityLabel[t.severity])}</td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<header>
  <div>${escapeHtml(school)}</div>
  <div>${escapeHtml(header.psychologistName)}</div>
  <div>${escapeHtml(header.generatedAt)}</div>
</header>
<section>
  <div>${escapeHtml(student.name)}${escapeHtml(classLabelStr)}</div>
</section>
<section>
  <svg viewBox="0 0 ${SPARKLINE_W} ${SPARKLINE_H}" width="100%" height="${SPARKLINE_H}" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${points}" fill="none" stroke="black" stroke-width="2" />
  </svg>
</section>
<section>
  <table>${testsRows}</table>
</section>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintProfile(input: BuildPrintProfileInput): PrintProfile {
  return {
    header: {
      schoolName: input.schoolName,
      psychologistName: input.psychologistName,
      generatedAt: almatyDay(input.today),
    },
    student: {
      name: input.student.name,
      classLabel: classLabel(input.student.grade, input.student.classLetter),
    },
    mood: buildMoodWindow(input.moodHistory, input.today),
    tests: buildTests(input.testResults),
  };
}
