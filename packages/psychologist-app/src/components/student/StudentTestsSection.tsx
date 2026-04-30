import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";
import { SeverityBadge } from "../ui/SeverityBadge.js";
import { AiReportCard } from "../diagnostics/AiReportCard.js";
import type { DiagnosticSession } from "@tirek/shared";

interface StudentTestsSectionProps {
  testResults: (DiagnosticSession & { testSlug?: string; testName?: string })[];
}

export function StudentTestsSection({ testResults }: StudentTestsSectionProps) {
  const t = useT();
  const d = t.psychologist.studentDetail;
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  if (testResults.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">{d.testsTab}</h2>
        <div className="bg-surface rounded-xl border border-border-light p-6 flex flex-col items-center text-center">
          <FileText size={24} className="text-ink-muted mb-2" />
          <p className="text-sm text-ink-muted">{t.common.noData}</p>
        </div>
      </section>
    );
  }

  const ordered = [...testResults].sort((a, b) => {
    const da = a.completedAt ?? a.startedAt ?? "";
    const db = b.completedAt ?? b.startedAt ?? "";
    return db.localeCompare(da);
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">{d.testsTab}</h2>
      <div className="space-y-2">
        {ordered.map((result) => {
          const isExpanded = expandedSessionId === result.id;
          const hasReport = Boolean(result.completedAt);
          return (
            <div
              key={result.id}
              className="bg-surface rounded-xl border border-border-light"
            >
              <button
                type="button"
                onClick={() =>
                  hasReport &&
                  setExpandedSessionId(isExpanded ? null : result.id)
                }
                disabled={!hasReport}
                className="w-full text-left p-3.5 flex items-start justify-between gap-3 disabled:cursor-default"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">
                    {result.testName ?? result.testSlug ?? result.testId}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {result.totalScore != null && (
                    <span className="text-sm font-bold text-ink">
                      {result.totalScore}/{result.maxScore ?? "?"}
                    </span>
                  )}
                  {result.severity && <SeverityBadge severity={result.severity} />}
                  {hasReport &&
                    (isExpanded ? (
                      <ChevronUp size={16} className="text-ink-muted" />
                    ) : (
                      <ChevronDown size={16} className="text-ink-muted" />
                    ))}
                </div>
              </button>
              {isExpanded && hasReport && (
                <div className="border-t border-border-light p-4 bg-surface-secondary/30 rounded-b-xl">
                  <AiReportCard sessionId={result.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
