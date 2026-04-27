import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { formatRiskReason } from "@tirek/shared";
import type { RiskReason } from "@tirek/shared/api";
import type { User } from "@tirek/shared";
import type { MoodTrendResult, EngagementResult } from "../../utils/mood-analytics.js";
import { statusToRiskLevel } from "../../utils/mood-analytics.js";

interface StudentHeroCardProps {
  student: User;
  status: "normal" | "attention" | "crisis";
  reason: RiskReason | null;
  moodTrend: MoodTrendResult;
  engagement: EngagementResult;
}

const statusRingColors: Record<string, string> = {
  normal: "ring-success",
  attention: "ring-warning",
  crisis: "ring-danger",
};

const trendIcons = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendColors = {
  improving: "text-success",
  stable: "text-text-light",
  declining: "text-danger",
};

const riskColors = {
  low: "text-success",
  medium: "text-warning",
  high: "text-danger",
};

const engagementColors = {
  high: "text-success",
  medium: "text-warning",
  low: "text-text-light",
};

export function StudentHeroCard({ student, status, reason, moodTrend, engagement }: StudentHeroCardProps) {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;

  const TrendIcon = trendIcons[moodTrend.trend];
  const riskLevel = statusToRiskLevel(status);
  const reasonText = status !== "normal" ? formatRiskReason({ reason, t, language }) : null;

  const trendLabels = { improving: d.improving, stable: d.stable, declining: d.declining };
  const riskLabels = { low: d.riskLow, medium: d.riskMedium, high: d.riskHigh };
  const engagementLabels = { high: d.engagementHigh, medium: d.engagementMedium, low: d.engagementLow };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "w-13 h-13 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0 ring-[3px]",
            statusRingColors[status],
            status === "crisis" && "animate-pulse-border",
          )}
        >
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main truncate">{student.name}</h1>
            <StatusBadge status={status} size="sm" />
          </div>
          {reasonText && (
            <p
              className={clsx(
                "flex items-center gap-1 text-xs font-medium mt-1",
                status === "crisis" ? "text-danger" : "text-warning",
              )}
            >
              <AlertTriangle size={12} className="shrink-0" />
              <span className="truncate">{reasonText}</span>
            </p>
          )}
          <p className="text-xs text-text-light mt-0.5 truncate">
            {student.grade != null
              ? `${student.grade}${student.classLetter ?? ""} ${d.class}`
              : ""}{" "}
            &middot; {student.email}
          </p>
        </div>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {/* Mood Trend */}
        <div className="rounded-lg bg-surface-secondary/70 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-base font-bold text-text-main">
              {moodTrend.average > 0 ? moodTrend.average.toFixed(1) : "—"}
            </span>
            <TrendIcon size={14} className={trendColors[moodTrend.trend]} />
          </div>
          <p className={clsx("text-[10px] font-medium mt-0.5", trendColors[moodTrend.trend])}>
            {trendLabels[moodTrend.trend]}
          </p>
          <p className="text-[9px] text-text-light">{d.moodTrend}</p>
        </div>

        {/* Risk Level */}
        <div className="rounded-lg bg-surface-secondary/70 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck size={14} className={riskColors[riskLevel]} />
            <span className={clsx("text-xs font-bold", riskColors[riskLevel])}>
              {riskLabels[riskLevel]}
            </span>
          </div>
          <p className="text-[9px] text-text-light mt-1">{d.riskLevel}</p>
        </div>

        {/* Engagement */}
        <div className="rounded-lg bg-surface-secondary/70 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <Activity size={14} className={engagementColors[engagement.level]} />
            <span className="text-xs font-bold text-text-main">
              {engagement.activeDays}/{engagement.totalDays}
            </span>
          </div>
          <p className={clsx("text-[10px] font-medium mt-0.5", engagementColors[engagement.level])}>
            {engagementLabels[engagement.level]}
          </p>
          <p className="text-[9px] text-text-light">{d.engagement}</p>
        </div>
      </div>
    </div>
  );
}
