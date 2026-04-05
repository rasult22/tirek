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

export function AnalyticsPage() {
  const t = useT();

  const [grade, setGrade] = useState("");
  const [classLetter, setClassLetter] = useState("");

  const { data: report, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">
          {t.psychologist.analytics}
        </h1>
        <button
          onClick={() => exportApi.classCSV(grade ? Number(grade) : undefined, classLetter || undefined)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input-border text-sm
            font-medium text-text-main hover:bg-surface-hover transition-colors"
        >
          <Download size={14} />
          {t.psychologist.exportReport}
        </button>
      </div>

      {/* Class selector */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            {t.auth.selectGrade}
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-10 px-3 pr-8 rounded-lg border border-input-border bg-surface text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-light mb-1">
            {t.auth.selectClass}
          </label>
          <select
            value={classLetter}
            onChange={(e) => setClassLetter(e.target.value)}
            className="h-10 px-3 pr-8 rounded-lg border border-input-border bg-surface text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
          >
            <option value="">All</option>
            {["A", "B", "C", "D", "E"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-text-light" />
        </div>
      ) : report ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={report.totalStudents}
              icon={Users}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <StatCard
              label="Average Mood"
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
              label="Test Completion"
              value={`${Math.round(report.testCompletionRate * 100)}%`}
              icon={TrendingUp}
              iconBg="bg-warning/10"
              iconColor="text-warning"
            />
            <StatCard
              label="At Risk"
              value={report.atRiskCount}
              icon={AlertTriangle}
              iconBg="bg-danger/10"
              iconColor="text-danger"
            />
          </div>

          {/* Distribution charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood distribution */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-semibold text-text-main mb-4">
                Mood Distribution
              </h2>
              <MoodBar distribution={report.moodDistribution} />
              <div className="flex justify-between mt-3">
                <LegendItem
                  color="bg-success"
                  label="Happy"
                  value={report.moodDistribution.happy}
                />
                <LegendItem
                  color="bg-warning"
                  label="Neutral"
                  value={report.moodDistribution.neutral}
                />
                <LegendItem
                  color="bg-danger"
                  label="Sad"
                  value={report.moodDistribution.sad}
                />
              </div>
            </div>

            {/* Risk distribution */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-semibold text-text-main mb-4">
                Risk Zone Distribution
              </h2>
              <RiskBar distribution={report.riskDistribution} />
              <div className="flex justify-between mt-3">
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
        <div className="bg-surface rounded-xl border border-border shadow-sm p-8 text-center">
          <BarChart3 size={40} className="text-text-light mx-auto mb-3" />
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
    <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-light font-medium">{label}</p>
          <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
        </div>
        <div
          className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            iconBg,
          )}
        >
          <Icon size={20} className={iconColor} />
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
    return <div className="w-full h-6 rounded-full bg-surface-secondary" />;
  }
  const hp = (distribution.happy / total) * 100;
  const np = (distribution.neutral / total) * 100;
  const sp = (distribution.sad / total) * 100;

  return (
    <div className="w-full h-6 rounded-full bg-surface-secondary overflow-hidden flex">
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
    return <div className="w-full h-6 rounded-full bg-surface-secondary" />;
  }
  const np = (distribution.normal / total) * 100;
  const ap = (distribution.attention / total) * 100;
  const cp = (distribution.crisis / total) * 100;

  return (
    <div className="w-full h-6 rounded-full bg-surface-secondary overflow-hidden flex">
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
    <div className="flex items-center gap-2">
      <span className={clsx("w-3 h-3 rounded-sm", color)} />
      <span className="text-xs text-text-light">
        {label}: {value}
      </span>
    </div>
  );
}
