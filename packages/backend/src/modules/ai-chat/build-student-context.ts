export type StudentContextUser = {
  name: string;
  grade: number | null;
  classLetter: string | null;
  language: string;
};

export type StudentContextMood = {
  mood: number;
  stressLevel: number | null;
  sleepQuality: number | null;
  createdAt: Date;
};

export type StudentContextTest = {
  testName: string;
  completedAt: Date | null;
  totalScore?: number | null;
  maxScore?: number | null;
  severity?: string | null;
};

export type StudentContextInput = {
  user: StudentContextUser;
  recentMoods: StudentContextMood[];
  recentTests: StudentContextTest[];
  mode: string;
};

export type StudentContextOutput = {
  context: string;
  language: string;
};

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildStudentContextPure(
  input: StudentContextInput,
): StudentContextOutput {
  const { user, recentMoods, recentTests, mode } = input;

  const className = user.grade && user.classLetter
    ? `${user.grade}${user.classLetter}`
    : user.grade
      ? `${user.grade} класс`
      : "не указан";

  const langLabel = user.language === "kz" ? "казахский" : "русский";
  let context = `\n═══ КОНТЕКСТ УЧЕНИКА (не озвучивай напрямую, используй для понимания) ═══\nИмя: ${user.name}\nКласс: ${className}\nЯзык интерфейса: ${langLabel}\nРежим сессии: ${mode}\n\n⚠️ ОБЯЗАТЕЛЬНО: Отвечай на ${langLabel} языке — это язык, выбранный учеником в настройках.`;

  if (recentMoods.length > 0) {
    const avgMood = Math.round(
      (recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length) * 10,
    ) / 10;
    const stressEntries = recentMoods.filter((m) => m.stressLevel != null);
    const avgStress = stressEntries.length > 0
      ? Math.round(
          (stressEntries.reduce((s, m) => s + (m.stressLevel ?? 0), 0) /
            stressEntries.length) *
            10,
        ) / 10
      : null;

    context += `\n\nНастроение за 7 дней: среднее ${avgMood}/5 (${recentMoods.length} записей)`;
    if (avgStress !== null) context += `, стресс ${avgStress}/5`;
  }

  const completedTests = recentTests.filter((t) => t.completedAt);
  if (completedTests.length > 0) {
    const lines = completedTests
      .map((t) => `  - ${t.testName} (пройден ${formatIsoDate(t.completedAt!)})`)
      .join("\n");
    context += `\n\nНедавние тесты (только факт прохождения, без баллов):\n${lines}`;
  }

  return { context, language: user.language };
}
