import { useState } from "react";
import { Loader2, FileText, Brain, Award, Lock } from "lucide-react";
import { clsx } from "clsx";
import { useT } from "../../hooks/useLanguage.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import { SeverityBadge } from "../ui/SeverityBadge.js";
import type { DiagnosticSession, CbtEntry, ThoughtDiaryData, UserAchievementItem } from "@tirek/shared";

type SubTab = "tests" | "cbt" | "achievements";

interface StudentAssessmentsTabProps {
  testResults: (DiagnosticSession & { testSlug?: string; testName?: string })[];
  cbtEntries?: CbtEntry[];
  cbtLoading: boolean;
  achievements?: { achievements: UserAchievementItem[]; earnedCount: number; totalCount: number };
  achievementsLoading: boolean;
}

export function StudentAssessmentsTab({
  testResults,
  cbtEntries,
  cbtLoading,
  achievements,
  achievementsLoading,
}: StudentAssessmentsTabProps) {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;
  const [subTab, setSubTab] = useState<SubTab>("tests");

  const subTabs: { key: SubTab; label: string }[] = [
    { key: "tests", label: d.testsTab },
    { key: "cbt", label: d.cbtTab },
    { key: "achievements", label: d.achievementsTab },
  ];

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-surface-secondary/70 rounded-lg p-1">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={clsx(
              "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
              subTab === tab.key
                ? "bg-surface shadow-sm text-primary"
                : "text-text-light hover:text-text-main",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tests */}
      {subTab === "tests" && (
        <div>
          {testResults.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <FileText size={32} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-surface rounded-xl border border-border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-main">
                        {result.testName ?? result.testSlug ?? result.testId}
                      </p>
                      <p className="text-xs text-text-light mt-0.5">
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.totalScore != null && (
                        <span className="text-sm font-bold text-text-main">
                          {result.totalScore}/{result.maxScore ?? "?"}
                        </span>
                      )}
                      {result.severity && <SeverityBadge severity={result.severity} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CBT */}
      {subTab === "cbt" && (
        <div>
          {cbtLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : (cbtEntries ?? []).length > 0 ? (
            <div className="space-y-2">
              {(cbtEntries ?? []).map((entry: CbtEntry) => {
                const data = entry.type === "thought_diary" ? (entry.data as ThoughtDiaryData) : null;
                return (
                  <div
                    key={entry.id}
                    className="bg-surface rounded-xl border border-border shadow-sm p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700">
                        {t.cbt.thoughtDiary}
                      </span>
                      <span className="text-xs text-text-light">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {data && (
                      <div className="text-sm text-text-main space-y-1">
                        <p>
                          <span className="font-medium text-text-light">{t.cbt.situation}:</span>{" "}
                          {data.situation}
                        </p>
                        <p>
                          <span className="font-medium text-text-light">{t.cbt.thought}:</span>{" "}
                          {data.thought}
                        </p>
                        <p>
                          <span className="font-medium text-text-light">{t.cbt.emotion}:</span>{" "}
                          {data.emotion}
                          {data.emotionIntensity ? ` (${data.emotionIntensity}/10)` : ""}
                        </p>
                        {data.distortion && (
                          <p>
                            <span className="font-medium text-text-light">{t.cbt.distortion}:</span>{" "}
                            {data.distortion}
                          </p>
                        )}
                        {data.alternative && (
                          <p>
                            <span className="font-medium text-text-light">{t.cbt.alternative}:</span>{" "}
                            {data.alternative}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10">
              <Brain size={32} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      {subTab === "achievements" && (
        <div>
          {achievementsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : achievements && achievements.achievements.length > 0 ? (
            <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-main">{t.achievements.title}</h3>
                <span className="text-xs font-bold text-amber-600">
                  {achievements.earnedCount}/{achievements.totalCount}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {achievements.achievements.map((item) => {
                  const name =
                    language === "kz" && item.achievement.nameKz
                      ? item.achievement.nameKz
                      : item.achievement.nameRu;
                  return (
                    <div
                      key={item.achievement.slug}
                      className={clsx(
                        "flex flex-col items-center rounded-xl p-2.5 border transition-all",
                        item.earned
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-border-light bg-surface-secondary/50 opacity-50 grayscale",
                      )}
                    >
                      <span className="text-xl">{item.achievement.emoji}</span>
                      <span className="mt-1 text-center text-[10px] font-medium text-text-main leading-tight">
                        {name}
                      </span>
                      {item.earned && item.earnedAt ? (
                        <span className="mt-0.5 text-[9px] text-amber-600">
                          {new Date(item.earnedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <Lock size={9} className="mt-0.5 text-text-light" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10">
              <Award size={32} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
