import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  Loader2,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";
import { getResults, type DiagnosticsFilters } from "../../api/diagnostics.js";
import { SeverityBadge } from "../ui/SeverityBadge.js";
import { AiReportCard } from "./AiReportCard.js";
import { ErrorState } from "../ui/ErrorState.js";

interface Props {
  filters: DiagnosticsFilters;
}

export function ResultsSegment({ filters }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [reportSession, setReportSession] = useState<{
    sessionId: string;
    studentName?: string;
    testName?: string | null;
  } | null>(null);

  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: ["diagnostics", "results", filters],
    queryFn: () => getResults(filters),
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-text-light" />
      </div>
    );
  }

  if (!results || results.data.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <ClipboardList size={36} className="text-text-light mb-2" />
        <p className="text-sm text-text-light">{t.common.noData}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {results.data.map((row) => (
          <div
            key={row.sessionId}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border shadow-sm transition-all hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => navigate(`/students/${row.studentId}`)}
              className="btn-press flex flex-1 min-w-0 items-center gap-3 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {(row.studentName ?? "S").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-main truncate">
                    {row.studentName ?? "Student"}
                  </span>
                  {row.studentGrade && (
                    <span className="text-xs text-text-light shrink-0">
                      {row.studentGrade}
                      {row.studentClass ?? ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-light truncate">
                    {row.testName ?? row.testSlug ?? row.testId}
                  </span>
                  <span className="text-xs text-text-light">&middot;</span>
                  <span className="text-xs text-text-light">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {row.totalScore != null && (
                  <span className="text-xs font-bold text-text-main">
                    {row.totalScore}/{row.maxScore ?? "?"}
                  </span>
                )}
                {row.severity && <SeverityBadge severity={row.severity} />}
              </div>
              <ChevronRight size={14} className="text-text-light/40 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() =>
                setReportSession({
                  sessionId: row.sessionId,
                  studentName: row.studentName,
                  testName: row.testName,
                })
              }
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
              title="AI-анализ"
            >
              <Sparkles size={12} />
              AI-анализ
            </button>
          </div>
        ))}
      </div>

      {reportSession && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setReportSession(null)}
        >
          <div
            className="bg-surface w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  AI-анализ
                </p>
                <p className="truncate text-sm font-semibold text-text-main">
                  {reportSession.studentName ?? "Ученик"}
                  {reportSession.testName ? ` · ${reportSession.testName}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportSession(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-light hover:bg-surface-hover"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <AiReportCard sessionId={reportSession.sessionId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
