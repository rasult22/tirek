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
import { DataTable, type DataTableColumn } from "../ui/DataTable.js";
import type { DiagnosticResultRow } from "../../api/diagnostics.js";

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
      <div className="flex flex-col items-center py-12 rounded-xl bg-surface border border-border-light">
        <ClipboardList size={28} className="text-text-light mb-2" />
        <p className="text-sm text-text-light">{t.common.noData}</p>
      </div>
    );
  }

  const columns: DataTableColumn<DiagnosticResultRow>[] = [
    {
      key: "student",
      header: t.psychologist.assignSelectStudent,
      width: "30%",
      cell: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-soft text-brand-deep flex items-center justify-center text-[11px] font-semibold shrink-0">
            {(row.studentName ?? "S").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-text-main truncate text-sm">
              {row.studentName ?? "Student"}
            </div>
            {row.studentGrade && (
              <div className="text-[11px] text-text-light tabular-nums">
                {row.studentGrade}
                {row.studentClass ?? ""}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "test",
      header: t.psychologist.diagnostics,
      cell: (row) => (
        <span className="text-text-light text-sm truncate block">
          {row.testName ?? row.testSlug ?? row.testId}
        </span>
      ),
      hideOnSmall: true,
    },
    {
      key: "completedAt",
      header: "",
      width: "100px",
      hideOnSmall: true,
      cell: (row) => (
        <span className="text-xs text-text-light tabular-nums">
          {row.completedAt
            ? new Date(row.completedAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "score",
      header: "",
      width: "90px",
      align: "right",
      cell: (row) => (
        <div className="flex flex-col items-end gap-0.5">
          {row.totalScore != null && (
            <span className="text-xs font-bold text-text-main tabular-nums">
              {row.totalScore}/{row.maxScore ?? "?"}
            </span>
          )}
          {row.severity && <SeverityBadge severity={row.severity} />}
        </div>
      ),
    },
    {
      key: "ai",
      header: "",
      width: "110px",
      align: "right",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setReportSession({
              sessionId: row.sessionId,
              studentName: row.studentName,
              testName: row.testName,
            });
          }}
          className="inline-flex items-center gap-1 rounded-md border border-brand/20 bg-brand-soft px-2 py-1 text-[11px] font-bold text-brand-deep hover:bg-brand/15 transition-colors"
        >
          <Sparkles size={11} />
          AI-анализ
        </button>
      ),
    },
    {
      key: "chevron",
      header: "",
      width: "24px",
      align: "right",
      cell: () => <ChevronRight size={14} className="text-text-light/40" />,
    },
  ];

  return (
    <>
      <DataTable
        data={results.data}
        columns={columns}
        getRowKey={(row) => row.sessionId}
        density="compact"
        onRowClick={(row) => navigate(`/students/${row.studentId}`)}
      />

      {reportSession && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setReportSession(null)}
        >
          <div
            className="bg-surface w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border-light bg-surface px-5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-deep">
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
