import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { achievementsApi } from "../api/achievements.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import type { AchievementCategory } from "@tirek/shared";

const CATEGORY_ORDER: AchievementCategory[] = [
  "first_steps",
  "streak",
  "mastery",
  "growth",
];

export function AchievementsPage() {
  const t = useT();
  const { language } = useLanguage();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["achievements"],
    queryFn: achievementsApi.getAll,
  });

  const progressPercent =
    data && data.totalCount > 0
      ? Math.round((data.earnedCount / data.totalCount) * 100)
      : 0;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: t.achievements.categories[cat],
    items: (data?.achievements ?? []).filter(
      (a) => a.achievement.category === cat,
    ),
  }));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === "kz" ? "kk-KZ" : "ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-extrabold text-text-main">
            {t.achievements.title}
          </h1>
        </div>

        {/* Progress bar */}
        {data && (
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-amber-700">
                {t.achievements.progress}
              </span>
              <span className="text-sm font-extrabold text-amber-600">
                {data.earnedCount} / {data.totalCount}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-amber-200/60">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {isLoading && (
          <p className="mt-8 text-center text-sm text-text-light">
            {t.common.loading}
          </p>
        )}

        {/* Achievement groups */}
        {grouped.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.category} className="mt-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-light">
                  {group.label}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((item) => {
                    const name =
                      language === "kz" && item.achievement.nameKz
                        ? item.achievement.nameKz
                        : item.achievement.nameRu;
                    const desc =
                      language === "kz" && item.achievement.descriptionKz
                        ? item.achievement.descriptionKz
                        : item.achievement.descriptionRu;

                    return (
                      <div
                        key={item.achievement.slug}
                        className={`relative flex flex-col items-center rounded-2xl bg-surface p-4 shadow-sm transition-all ${
                          item.earned
                            ? ""
                            : "opacity-50 grayscale"
                        }`}
                      >
                        <span className="text-3xl">
                          {item.achievement.emoji}
                        </span>
                        <span className="mt-2 text-center text-xs font-bold text-text-main leading-tight">
                          {name}
                        </span>
                        {desc && (
                          <span className="mt-1 text-center text-[10px] text-text-light leading-tight">
                            {desc}
                          </span>
                        )}
                        {item.earned && item.earnedAt ? (
                          <span className="mt-1.5 text-[10px] font-medium text-amber-600">
                            {formatDate(item.earnedAt)}
                          </span>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-0.5 text-[10px] text-text-light">
                            <Lock size={10} />
                            {t.achievements.locked}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
        )}
      </div>
    </AppLayout>
  );
}
