import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { getResults } from "../api/diagnostics.js";
import { SeverityBadge } from "../components/ui/SeverityBadge.js";
import {
  ClipboardPlus,
  ClipboardList,
  Loader2,
  Calendar,
  Download,
  ChevronRight,
} from "lucide-react";
import { exportApi } from "../api/export.js";
import { ErrorState } from "../components/ui/ErrorState.js";

export function DiagnosticsPage() {
  const t = useT();
  const navigate = useNavigate();

  const [testSlug, setTestSlug] = useState("");
  const [severity, setSeverity] = useState("");
  const [grade, setGrade] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "diagnostics",
      "results",
      { testSlug, severity, grade, dateFrom, dateTo },
    ],
    queryFn: () =>
      getResults({
        testSlug: testSlug || undefined,
        severity: severity || undefined,
        grade: grade ? Number(grade) : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      }),
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.diagnostics}
        </h1>
        <button
          onClick={() => navigate("/diagnostics/assign")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs
            font-semibold hover:bg-primary-dark transition-colors"
        >
          <ClipboardPlus size={14} />
          {t.psychologist.assignTest}
        </button>
      </div>

      {/* Scrollable filters */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          <select
            value={testSlug}
            onChange={(e) => setTestSlug(e.target.value)}
            className="h-9 px-2 pr-6 rounded-lg border border-input-border bg-surface text-xs text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All tests</option>
            <option value="phq-a">{t.tests.phqName}</option>
            <option value="gad-7">{t.tests.gadName}</option>
            <option value="rosenberg">{t.tests.rosenbergName}</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-9 px-2 pr-6 rounded-lg border border-input-border bg-surface text-xs text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">Severity</option>
            <option value="minimal">Minimal</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-9 px-2 pr-6 rounded-lg border border-input-border bg-surface text-xs text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">Grade</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="relative">
            <Calendar
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 pl-6 pr-2 rounded-lg border border-input-border bg-surface text-xs text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="relative">
            <Calendar
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 pl-6 pr-2 rounded-lg border border-input-border bg-surface text-xs text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            onClick={() => exportApi.classCSV(grade ? Number(grade) : undefined)}
            className="flex items-center gap-1 h-9 px-2.5 rounded-lg border border-input-border text-xs
              font-medium text-text-main hover:bg-surface-hover transition-colors shrink-0"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Results as cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-light" />
        </div>
      ) : results && results.data.length > 0 ? (
        <div className="space-y-2">
          {results.data.map((row) => (
            <button
              key={row.sessionId}
              onClick={() => navigate(`/students/${row.studentId}`)}
              className="btn-press w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border shadow-sm transition-all hover:shadow-md text-left"
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
                      {row.studentGrade}{row.studentClass ?? ""}
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
                      : "\u2014"}
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12">
          <ClipboardList size={36} className="text-text-light mb-2" />
          <p className="text-sm text-text-light">{t.common.noData}</p>
        </div>
      )}
    </div>
  );
}
