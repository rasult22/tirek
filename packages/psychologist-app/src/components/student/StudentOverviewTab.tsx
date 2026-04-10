import { useState } from "react";
import { Loader2, FileText, Brain, Award, Lock, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useT } from "../../hooks/useLanguage.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { MoodSparkline } from "./MoodSparkline.js";
import { SeverityBadge } from "../ui/SeverityBadge.js";
import type { MoodEntry, DiagnosticSession, CbtEntry, ThoughtDiaryData, UserAchievementItem } from "@tirek/shared";
import type { MoodTrendResult } from "../../utils/mood-analytics.js";

interface StudentOverviewTabProps {
  moodTrend: MoodTrendResult;
  moodHistory: MoodEntry[];
  testResults: (DiagnosticSession & { testSlug?: string; testName?: string })[];
  cbtEntries?: CbtEntry[];
  cbtLoading: boolean;
  achievements?: { achievements: UserAchievementItem[]; earnedCount: number; totalCount: number };
  achievementsLoading: boolean;
  onSwitchToAssessments: () => void;
}

export function StudentOverviewTab({
  moodTrend,
  moodHistory,
  testResults,
  cbtEntries,
  cbtLoading,
  achievements,
  achievementsLoading,
  onSwitchToAssessments,
}: StudentOverviewTabProps) {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;

  const latestEntry = moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : undefined;
  const recentTests = testResults.slice(-3).reverse();
  const recentCbt = (cbtEntries ?? []).slice(-3).reverse();
  const earnedAchievements = (achievements?.achievements ?? []).filter((a) => a.earned);
  const recentEarned = earnedAchievements.slice(-3).reverse();

  return (
    <div className="space-y-4 stagger-children">
      {/* Sparkline */}
      <MoodSparkline data={moodTrend.data} average={moodTrend.average} latestEntry={latestEntry} />

      {/* Recent Tests */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-text-main">{d.recentTests}</h3>
          {testResults.length > 3 && (
            <button
              onClick={onSwitchToAssessments}
              className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
            >
              {d.seeAll}
              <ChevronRight size={12} />
            </button>
          )}
        </div>
        {recentTests.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-text-light">
            <FileText size={16} />
            {t.common.noData}
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentTests.map((result) => (
              <div key={result.id} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {result.testName ?? result.testSlug ?? result.testId}
                  </p>
                  <p className="text-[10px] text-text-light">
                    {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {result.totalScore != null && (
                    <span className="text-xs font-bold text-text-main">
                      {result.totalScore}/{result.maxScore ?? "?"}
                    </span>
                  )}
                  {result.severity && <SeverityBadge severity={result.severity} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent CBT */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-text-main">{d.recentCbt}</h3>
          {(cbtEntries ?? []).length > 3 && (
            <button
              onClick={onSwitchToAssessments}
              className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
            >
              {d.seeAll}
              <ChevronRight size={12} />
            </button>
          )}
        </div>
        {cbtLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 size={18} className="animate-spin text-text-light" />
          </div>
        ) : recentCbt.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-text-light">
            <Brain size={16} />
            {t.common.noData}
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentCbt.map((entry) => {
              const data = entry.type === "thought_diary" ? (entry.data as ThoughtDiaryData) : null;
              return (
                <div key={entry.id} className="py-1.5 border-b border-border-light last:border-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700">
                      {t.cbt.thoughtDiary}
                    </span>
                    <span className="text-[10px] text-text-light">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {data && (
                    <p className="text-xs text-text-main truncate">
                      {data.situation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements Summary */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-text-main">{t.achievements.title}</h3>
          {achievements && (
            <span className="text-xs font-bold text-amber-600">
              {achievements.earnedCount}/{achievements.totalCount}
            </span>
          )}
        </div>
        {achievementsLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 size={18} className="animate-spin text-text-light" />
          </div>
        ) : recentEarned.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-text-light">
            <Award size={16} />
            {t.common.noData}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {recentEarned.map((item) => (
              <div
                key={item.achievement.slug}
                className="flex flex-col items-center rounded-xl p-2 border border-amber-200 bg-amber-50/50 min-w-[60px]"
              >
                <span className="text-xl">{item.achievement.emoji}</span>
                <span className="mt-0.5 text-center text-[9px] font-medium text-text-main leading-tight">
                  {language === "kz" && item.achievement.nameKz
                    ? item.achievement.nameKz
                    : item.achievement.nameRu}
                </span>
              </div>
            ))}
            {earnedAchievements.length > 3 && (
              <button
                onClick={onSwitchToAssessments}
                className="flex flex-col items-center justify-center rounded-xl p-2 border border-border-light bg-surface-secondary/50 min-w-[60px] text-text-light hover:text-primary transition-colors"
              >
                <span className="text-sm font-bold">+{earnedAchievements.length - 3}</span>
                <span className="text-[9px]">{d.seeAll}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
