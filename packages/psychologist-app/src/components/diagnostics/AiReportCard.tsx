import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Info,
  LineChart,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
  Wind,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  AiReportRecommendationType,
  DiagnosticAiReport,
} from "@tirek/shared";
import {
  getReport,
  getSessionAnswers,
  regenerateReport,
} from "../../api/diagnostics.js";

interface AiReportCardProps {
  sessionId: string;
}

const RISK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-success/15", text: "text-success", label: "Низкий" },
  moderate: { bg: "bg-warning/15", text: "text-warning", label: "Средний" },
  high: { bg: "bg-danger/15", text: "text-danger", label: "Высокий" },
};

const RECOMMENDATION_META: Record<
  AiReportRecommendationType,
  { icon: typeof Stethoscope; label: string }
> = {
  therapy: {
    icon: Users,
    label: "Индивидуальная беседа",
  },
  exercise: {
    icon: Wind,
    label: "Упражнение",
  },
  referral: {
    icon: Stethoscope,
    label: "Направление",
  },
  monitoring: {
    icon: LineChart,
    label: "Наблюдение",
  },
  conversation: {
    icon: Users,
    label: "Разговор",
  },
};

function isReadyReport(
  r: DiagnosticAiReport | { status: "pending" } | undefined,
): r is DiagnosticAiReport {
  return Boolean(r && "summary" in r && r.status === "ready");
}

function isErrorReport(
  r: DiagnosticAiReport | { status: "pending" } | undefined,
): r is DiagnosticAiReport {
  return Boolean(r && "status" in r && r.status === "error");
}

export function AiReportCard({ sessionId }: AiReportCardProps) {
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ["diagnostics", "report", sessionId],
    queryFn: () => getReport(sessionId),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 3000;
      if ("status" in d && d.status === "pending") return 3000;
      return false;
    },
  });

  const { data: answers } = useQuery({
    queryKey: ["diagnostics", "answers", sessionId],
    queryFn: () => getSessionAnswers(sessionId),
    enabled: isReadyReport(report),
  });

  const regenerate = useMutation({
    mutationFn: () => regenerateReport(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnostics", "report", sessionId],
      });
    },
  });

  const flaggedWithText = useMemo(() => {
    if (!isReadyReport(report) || !report.flaggedItems || !answers) return [];
    return report.flaggedItems.map((f) => {
      const a = answers.items.find((i) => i.questionIndex === f.questionIndex);
      return {
        ...f,
        questionText: a?.questionText ?? null,
        answerLabel: a?.answerLabel ?? null,
        answerValue: a?.answer ?? null,
      };
    });
  }, [report, answers]);

  if (isLoading || !report) {
    return (
      <div className="rounded-2xl border border-border-light bg-surface p-5">
        <SkeletonReport />
      </div>
    );
  }

  if (isErrorReport(report)) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5">
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle size={18} />
          <p className="text-sm font-bold">Не удалось сгенерировать отчёт</p>
        </div>
        {report.errorMessage && (
          <p className="mt-2 text-xs text-danger">{report.errorMessage}</p>
        )}
        <button
          type="button"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {regenerate.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Перегенерировать
        </button>
      </div>
    );
  }

  if (!isReadyReport(report)) {
    return (
      <div className="rounded-2xl border border-border-light bg-surface p-5">
        <SkeletonReport />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border-light bg-surface p-5">
      {/* Header — neutral surface with brand-soft accent */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
            <Bot size={18} className="text-brand-deep" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-deep">
              AI-анализ результата
            </p>
            {report.generatedAt && (
              <p className="text-[11px] text-text-light">
                Сформировано{" "}
                {new Date(report.generatedAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-border-light px-2 py-1 text-[11px] font-semibold text-text-light hover:bg-surface-hover disabled:opacity-60"
          title="Перегенерировать"
        >
          {regenerate.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Обновить
        </button>
      </div>

      {/* Summary — most important, larger */}
      {report.summary && (
        <p className="text-base font-semibold leading-snug text-text-main">
          {report.summary}
        </p>
      )}

      {/* Interpretation */}
      {report.interpretation && (
        <div>
          <SectionTitle icon={Sparkles} label="Интерпретация" />
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-text-main">
            {report.interpretation}
          </p>
        </div>
      )}

      {/* Trend */}
      {report.trend && (
        <div className="rounded-xl border border-border-light bg-surface-secondary p-3">
          <div className="flex items-center gap-2">
            <LineChart size={14} className="text-text-light" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-light">
              Динамика
            </p>
          </div>
          <p className="mt-1 text-sm text-text-main">{report.trend}</p>
        </div>
      )}

      {/* Risk factors */}
      {report.riskFactors && report.riskFactors.length > 0 && (
        <div>
          <SectionTitle icon={ShieldAlert} label="Факторы риска" />
          <ul className="mt-2 space-y-2">
            {report.riskFactors.map((rf, idx) => {
              const meta = RISK_STYLES[rf.severity] ?? RISK_STYLES.moderate;
              return (
                <li
                  key={idx}
                  className="flex gap-3 rounded-xl border border-border-light p-3"
                >
                  <span
                    className={clsx(
                      "mt-0.5 inline-flex h-fit items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold",
                      meta.bg,
                      meta.text,
                    )}
                  >
                    {meta.label}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-main">
                      {rf.factor}
                    </p>
                    {rf.evidence && (
                      <p className="mt-0.5 text-xs text-text-light">
                        {rf.evidence}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <SectionTitle icon={CheckCircle2} label="Рекомендации" />
          <ul className="mt-2 space-y-2">
            {report.recommendations.map((r, idx) => {
              const meta =
                RECOMMENDATION_META[r.type] ?? RECOMMENDATION_META.monitoring;
              const Icon = meta.icon;
              return (
                <li
                  key={idx}
                  className="flex gap-3 rounded-xl border border-border-light p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                    <Icon size={16} className="text-text-light" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-light">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-sm text-text-main">{r.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Flagged items */}
      {flaggedWithText.length > 0 && (
        <details className="rounded-xl border border-warning/30 bg-warning/10 p-3">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-warning">
            <AlertTriangle size={14} />
            Тревожные ответы ({flaggedWithText.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {flaggedWithText.map((f, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-warning/20 bg-surface p-2.5"
              >
                {f.questionText && (
                  <p className="text-xs font-semibold text-text-main">
                    {f.questionText}
                  </p>
                )}
                {(f.answerLabel || f.answerValue !== null) && (
                  <p className="mt-1 text-xs text-text-light">
                    Ответ:{" "}
                    <span className="font-bold text-warning">
                      {f.answerLabel ?? `значение ${f.answerValue}`}
                    </span>
                  </p>
                )}
                {f.reason && (
                  <p className="mt-1 text-[11px] italic text-text-light">
                    {f.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-surface-secondary p-2.5 text-[11px] text-text-light">
        <Info size={12} className="mt-0.5 shrink-0" />
        <p>
          Отчёт сформирован ИИ на основе ответов ученика и требует
          профессиональной оценки специалистом.
        </p>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: typeof Stethoscope;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-text-light" />
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-light">
        {label}
      </p>
    </div>
  );
}

function SkeletonReport() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
          <Loader2 size={18} className="animate-spin text-brand-deep" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-deep">
            AI-анализ результата
          </p>
          <p className="text-[11px] text-text-light">Генерируется…</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-hover" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-surface-hover" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-10 animate-pulse rounded-xl bg-surface-secondary" />
        <div className="h-10 animate-pulse rounded-xl bg-surface-secondary" />
      </div>
    </div>
  );
}
