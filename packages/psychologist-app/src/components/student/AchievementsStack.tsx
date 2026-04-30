import { Loader2, Award, Lock } from "lucide-react";
import { clsx } from "clsx";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import type { UserAchievementItem } from "@tirek/shared";

interface AchievementsStackProps {
  achievements?: { achievements: UserAchievementItem[]; earnedCount: number; totalCount: number };
  loading: boolean;
}

export function AchievementsStack({ achievements, loading }: AchievementsStackProps) {
  const t = useT();
  const { language } = useLanguage();

  return (
    <div className="bg-surface rounded-xl border border-border-light p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t.achievements.title}</h3>
        {achievements && (
          <span className="text-[11px] font-bold tabular-nums text-text-light">
            {achievements.earnedCount}
            <span className="text-text-light/60">/{achievements.totalCount}</span>
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 size={18} className="animate-spin text-text-light" />
        </div>
      ) : !achievements || achievements.achievements.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-xs text-text-light">
          <Award size={14} />
          {t.common.noData}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {achievements.achievements.map((item) => {
            const name =
              language === "kz" && item.achievement.nameKz
                ? item.achievement.nameKz
                : item.achievement.nameRu;
            const earnedDate = item.earnedAt
              ? new Date(item.earnedAt).toLocaleDateString(
                  language === "kz" ? "kk-KZ" : "ru-RU",
                  { day: "numeric", month: "short" },
                )
              : null;
            return (
              <li
                key={item.achievement.slug}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                  item.earned
                    ? "bg-warning/8 border border-warning/20"
                    : "bg-surface-secondary/40 border border-transparent opacity-60",
                )}
              >
                <span className="text-lg shrink-0">{item.achievement.emoji}</span>
                <span className="flex-1 text-xs font-medium text-text-main leading-tight truncate">
                  {name}
                </span>
                {item.earned && earnedDate ? (
                  <span className="text-[10px] tabular-nums text-text-light shrink-0">
                    {earnedDate}
                  </span>
                ) : (
                  <Lock size={11} className="text-text-light/60 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
