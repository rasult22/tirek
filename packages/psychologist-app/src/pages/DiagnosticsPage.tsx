import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { getResults } from "../api/diagnostics.js";
import { SeverityBadge } from "../components/ui/SeverityBadge.js";
import {
  ClipboardPlus,
  Filter,
  ClipboardList,
  Loader2,
  Calendar,
} from "lucide-react";

export function DiagnosticsPage() {
  const t = useT();
  const navigate = useNavigate();

  const [testSlug, setTestSlug] = useState("");
  const [severity, setSeverity] = useState("");
  const [grade, setGrade] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: results, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">
          {t.psychologist.diagnostics}
        </h1>
        <button
          onClick={() => navigate("/diagnostics/assign")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm
            font-semibold hover:bg-primary-dark transition-colors"
        >
          <ClipboardPlus size={16} />
          {t.psychologist.assignTest}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            Test
          </label>
          <select
            value={testSlug}
            onChange={(e) => setTestSlug(e.target.value)}
            className="h-10 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All tests</option>
            <option value="phq-a">{t.tests.phqName}</option>
            <option value="gad-7">{t.tests.gadName}</option>
            <option value="rosenberg">{t.tests.rosenbergName}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            Severity
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All</option>
            <option value="minimal">Minimal</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            Grade
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-10 px-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            From
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 pl-8 pr-3 rounded-lg border border-gray-300 bg-white text-sm text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            To
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 pl-8 pr-3 rounded-lg border border-gray-300 bg-white text-sm text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-text-light" />
          </div>
        ) : results && results.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Student
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Test
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Date
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-light">
                    Score
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/students/${row.userId}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {(row.studentName ?? "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-text-main">
                            {row.studentName ?? "Student"}
                          </span>
                          {row.studentGrade && (
                            <span className="ml-2 text-xs text-text-light">
                              {row.studentGrade}
                              {row.studentClass ?? ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-main">
                      {row.testName ?? row.testSlug ?? row.testId}
                    </td>
                    <td className="px-5 py-3.5 text-text-light">
                      {row.completedAt
                        ? new Date(row.completedAt).toLocaleDateString()
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-text-main">
                      {row.totalScore != null
                        ? `${row.totalScore}/${row.maxScore ?? "?"}`
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5">
                      {row.severity ? (
                        <SeverityBadge severity={row.severity} />
                      ) : (
                        "\u2014"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-16">
            <ClipboardList size={40} className="text-text-light mb-3" />
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
