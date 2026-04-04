import { db } from "../../db/index.js";
import { studentPsychologist, users } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";
import { analyticsService } from "../analytics/analytics.service.js";

// CSV helper
function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map((c) => {
    const str = c == null ? "" : String(c);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(",");
}

// BOM for Excel UTF-8 recognition
const UTF8_BOM = "\uFEFF";

async function verifyAccess(psychologistId: string, studentId: string) {
  const [link] = await db
    .select()
    .from(studentPsychologist)
    .where(
      and(
        eq(studentPsychologist.psychologistId, psychologistId),
        eq(studentPsychologist.studentId, studentId),
      ),
    )
    .limit(1);
  if (!link) throw new ForbiddenError("No access to this student");
}

async function getStudentInfo(studentId: string) {
  const [student] = await db
    .select({ name: users.name, grade: users.grade, classLetter: users.classLetter })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  if (!student) throw new NotFoundError("Student not found");
  return student;
}

export const exportService = {
  async generateStudentCSV(psychologistId: string, studentId: string): Promise<string> {
    await verifyAccess(psychologistId, studentId);
    const student = await getStudentInfo(studentId);
    const report = await analyticsService.getStudentReport(psychologistId, studentId);

    const lines: string[] = [];

    // Header
    lines.push(csvRow(["Отчёт по ученику"]));
    lines.push(csvRow(["Имя", student.name]));
    lines.push(csvRow(["Класс", student.grade ? `${student.grade}${student.classLetter ?? ""}` : "—"]));
    lines.push(csvRow(["Статус", report.status]));
    lines.push(csvRow(["Дата генерации", new Date().toISOString().split("T")[0]]));
    lines.push("");

    // Mood history
    lines.push(csvRow(["Дата", "Настроение (1-5)"]));
    for (const m of report.moodHistory) {
      lines.push(csvRow([m.date, m.mood]));
    }
    lines.push("");

    // Test results
    lines.push(csvRow(["Тест", "Балл", "Макс. балл", "Уровень", "Дата"]));
    for (const t of report.testResults) {
      lines.push(csvRow([
        t.testName,
        t.totalScore,
        t.maxScore,
        t.severity,
        t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : "—",
      ]));
    }

    return UTF8_BOM + lines.join("\r\n");
  },

  async generateClassCSV(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ): Promise<string> {
    const report = await analyticsService.getClassReport(psychologistId, grade, classLetter);

    const classLabel = grade ? `${grade}${classLetter ?? ""}` : "Все";

    const lines: string[] = [];

    // Summary
    lines.push(csvRow(["Отчёт по классу"]));
    lines.push(csvRow(["Класс", classLabel]));
    lines.push(csvRow(["Всего учеников", report.totalStudents]));
    lines.push(csvRow(["Среднее настроение", report.averageMood]));
    lines.push(csvRow(["Процент завершения тестов", `${Math.round(report.testCompletionRate * 100)}%`]));
    lines.push(csvRow(["Учеников в зоне риска", report.atRiskCount]));
    lines.push(csvRow(["Дата генерации", new Date().toISOString().split("T")[0]]));
    lines.push("");

    // Mood distribution
    lines.push(csvRow(["Распределение настроений (7 дней)"]));
    lines.push(csvRow(["Хорошее (4-5)", report.moodDistribution.happy]));
    lines.push(csvRow(["Нормальное (3)", report.moodDistribution.neutral]));
    lines.push(csvRow(["Плохое (1-2)", report.moodDistribution.sad]));
    lines.push("");

    // Risk distribution
    lines.push(csvRow(["Распределение рисков"]));
    lines.push(csvRow(["Норма", report.riskDistribution.normal]));
    lines.push(csvRow(["Требует внимания", report.riskDistribution.attention]));
    lines.push(csvRow(["Кризис", report.riskDistribution.crisis]));

    return UTF8_BOM + lines.join("\r\n");
  },
};
