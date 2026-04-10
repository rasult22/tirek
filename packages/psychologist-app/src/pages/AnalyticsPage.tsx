import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
import { classReport } from "../api/analytics.js";
import {
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  SmilePlus,
  Download,
} from "lucide-react";
import { clsx } from "clsx";
import { exportApi } from "../api/export.js";
import { ErrorState } from "../components/ui/ErrorState.js";

export function AnalyticsPage() {
  const t = useT();

  const [grade, setGrade] = useState("");
  const [classLetter, setClassLetter] = useState("");

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "analytics",
      "class",
      { grade: grade || undefined, classLetter: classLetter || undefined },
    ],
    queryFn: () =>
      classReport({
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      }),
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.analytics}
        </h1>
        <button
          onClick={() => exportApi.classCSV(grade ? Number(grade) : undefined, classLetter || undefined)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input-border text-xs
            font-medium text-text-main hover:bg-surface-hover transition-colors"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="flex-1 h-10 px-3 rounded-xl border border-input-border bg-surface text-sm text-text-main
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
        >
          <option value="">{t.psychologist.allGrades}</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={classLetter}
          onChange={(e) => setClassLetter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input-border bg-surface text-sm text-text-main
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
        >
          <option value="">{t.psychologist.allClasses}</option>
          {["A", "B", "C", "D", "E"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-light" />
        </div>
      ) : report ? (
        <>
          {/* Stat cards — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t.psychologist.totalStudents}
              value={report.totalStudents}
              icon={Users}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <StatCard
              label={t.psychologist.averageMood}
              value={
                report.averageMood != null
                  ? report.averageMood.toFixed(1)
                  : "\u2014"
              }
              icon={SmilePlus}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label={t.psychologist.testCompletion}
              value={`${Math.round(report.testCompletionRate * 100)}%`}
              icon={TrendingUp}
              iconBg="bg-warning/10"
              iconColor="text-warning"
            />
            <StatCard
              label={t.psychologist.atRisk}
              value={report.atRiskCount}
              icon={AlertTriangle}
              iconBg="bg-danger/10"
              iconColor="text-danger"
            />
          </div>

          {/* Distribution charts — stacked */}
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <h2 className="text-sm font-semibold text-text-main mb-3">
                {t.psychologist.moodDistribution}
              </h2>
              <MoodBar distribution={report.moodDistribution} />
              <div className="flex justify-between mt-2.5">
                <LegendItem
                  color="bg-success"
                  label={t.psychologist.moodHappy}
                  value={report.moodDistribution.happy}
                />
                <LegendItem
                  color="bg-warning"
                  label={t.psychologist.moodNeutral}
                  value={report.moodDistribution.neutral}
                />
                <LegendItem
                  color="bg-danger"
                  label={t.psychologist.moodSad}
                  value={report.moodDistribution.sad}
                />
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <h2 className="text-sm font-semibold text-text-main mb-3">
                {t.psychologist.riskDistribution}
              </h2>
              <RiskBar distribution={report.riskDistribution} />
              <div className="flex justify-between mt-2.5">
                <LegendItem
                  color="bg-success"
                  label={t.psychologist.statusNormal}
                  value={report.riskDistribution.normal}
                />
                <LegendItem
                  color="bg-warning"
                  label={t.psychologist.statusAttention}
                  value={report.riskDistribution.attention}
                />
                <LegendItem
                  color="bg-danger"
                  label={t.psychologist.statusCrisis}
                  value={report.riskDistribution.crisis}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
          <BarChart3 size={36} className="text-text-light mx-auto mb-2" />
          <p className="text-sm text-text-light">{t.common.noData}</p>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-light font-medium">{label}</p>
          <p className="text-xl font-bold text-text-main mt-0.5">{value}</p>
        </div>
        <div
          className={clsx(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            iconBg,
          )}
        >
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function MoodBar({
  distribution,
}: {
  distribution: { happy: number; neutral: number; sad: number };
}) {
  const total = distribution.happy + distribution.neutral + distribution.sad;
  if (total === 0) {
    return <div className="w-full h-5 rounded-full bg-surface-secondary" />;
  }
  const hp = (distribution.happy / total) * 100;
  const np = (distribution.neutral / total) * 100;
  const sp = (distribution.sad / total) * 100;

  return (
    <div className="w-full h-5 rounded-full bg-surface-secondary overflow-hidden flex">
      {hp > 0 && (
        <div
          className="bg-success h-full transition-all"
          style={{ width: `${hp}%` }}
        />
      )}
      {np > 0 && (
        <div
          className="bg-warning h-full transition-all"
          style={{ width: `${np}%` }}
        />
      )}
      {sp > 0 && (
        <div
          className="bg-danger h-full transition-all"
          style={{ width: `${sp}%` }}
        />
      )}
    </div>
  );
}

function RiskBar({
  distribution,
}: {
  distribution: { normal: number; attention: number; crisis: number };
}) {
  const total =
    distribution.normal + distribution.attention + distribution.crisis;
  if (total === 0) {
    return <div className="w-full h-5 rounded-full bg-surface-secondary" />;
  }
  const np = (distribution.normal / total) * 100;
  const ap = (distribution.attention / total) * 100;
  const cp = (distribution.crisis / total) * 100;

  return (
    <div className="w-full h-5 rounded-full bg-surface-secondary overflow-hidden flex">
      {np > 0 && (
        <div
          className="bg-success h-full transition-all"
          style={{ width: `${np}%` }}
        />
      )}
      {ap > 0 && (
        <div
          className="bg-warning h-full transition-all"
          style={{ width: `${ap}%` }}
        />
      )}
      {cp > 0 && (
        <div
          className="bg-danger h-full transition-all"
          style={{ width: `${cp}%` }}
        />
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={clsx("w-2.5 h-2.5 rounded-sm", color)} />
      <span className="text-[11px] text-text-light">
        {label}: {value}
      </span>
    </div>
  );
}
