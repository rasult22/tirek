import { analyticsService } from "../analytics/analytics.service.js";
import { csvRow, csvFile } from "../../lib/csv-export/csv-formatter.js";

export const exportService = {
  async generateClassCSV(
    psychologistId: string,
    grade?: number,
    classLetter?: string,
  ): Promise<string> {
    const report = await analyticsService.getClassReport(psychologistId, grade, classLetter);

    const classLabel = grade ? `${grade}${classLetter ?? ""}` : "Все";

    const lines: string[] = [];

    lines.push(csvRow(["Отчёт по классу"]));
    lines.push(csvRow(["Класс", classLabel]));
    lines.push(csvRow(["Всего учеников", report.totalStudents]));
    lines.push(csvRow(["Среднее настроение", report.averageMood]));
    lines.push(csvRow(["Процент завершения тестов", `${Math.round(report.testCompletionRate * 100)}%`]));
    lines.push(csvRow(["Учеников в зоне риска", report.atRiskCount]));
    lines.push(csvRow(["Дата генерации", new Date().toISOString().split("T")[0]]));
    lines.push("");

    lines.push(csvRow(["Распределение настроений (7 дней)"]));
    lines.push(csvRow(["Хорошее (4-5)", report.moodDistribution.happy]));
    lines.push(csvRow(["Нормальное (3)", report.moodDistribution.neutral]));
    lines.push(csvRow(["Плохое (1-2)", report.moodDistribution.sad]));
    lines.push("");

    lines.push(csvRow(["Распределение рисков"]));
    lines.push(csvRow(["Норма", report.riskDistribution.normal]));
    lines.push(csvRow(["Требует внимания", report.riskDistribution.attention]));
    lines.push(csvRow(["Кризис", report.riskDistribution.crisis]));

    return csvFile(lines);
  },
};
