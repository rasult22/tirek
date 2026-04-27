import type { RiskReason } from "../api/index.js";
import type { Language, TranslationKeys } from "../i18n/index.js";

export interface FormatRiskReasonInput {
  reason: RiskReason | null;
  t: TranslationKeys;
  language: Language;
  now?: Date;
}

export function formatRiskReason(input: FormatRiskReasonInput): string | null {
  const { reason, t, language } = input;
  if (!reason) return null;

  const date = formatDate(reason.completedAt, language);
  const testName = reason.testName;
  const templates = t.psychologist.riskReason;

  switch (reason.kind) {
    case "severe_test_result":
      return interpolate(templates.severeTestResult, { testName, date });
    case "moderate_test_result":
      return interpolate(templates.moderateTestResult, { testName, date });
    case "flagged_items":
      return interpolate(templates.flaggedItems, { testName, date });
  }
}

function formatDate(iso: string, language: Language): string {
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}
