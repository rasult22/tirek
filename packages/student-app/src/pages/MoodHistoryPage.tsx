import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { moodApi } from "../api/mood.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { Last7DaysMood } from "../components/Last7DaysMood.js";

export function MoodHistoryPage() {
  const t = useT();
  const navigate = useNavigate();
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // Берём текущий месяц + предыдущий, если сегодня в первой неделе месяца.
  const needPrev = today.getDate() <= 7;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const { data: currentMonth, isError: errCurrent, refetch: refetchCurrent } = useQuery({
    queryKey: ["mood", "calendar", `${year}-${month}`],
    queryFn: () => moodApi.calendar(year, month),
  });

  const { data: previousMonth, isError: errPrev, refetch: refetchPrev } = useQuery({
    queryKey: ["mood", "calendar", `${prevYear}-${prevMonth}`],
    queryFn: () => moodApi.calendar(prevYear, prevMonth),
    enabled: needPrev,
  });

  const isError = errCurrent || (needPrev && errPrev);
  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => { refetchCurrent(); if (needPrev) refetchPrev(); }} />
      </AppLayout>
    );
  }

  const entries = [...(currentMonth ?? []), ...(previousMonth ?? [])];

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.mood.lastSevenDays}</h1>
        </div>

        <div className="mt-6">
          <Last7DaysMood
            entries={entries}
            today={today}
            weekdayShort={t.mood.weekdays}
            emptyLabel={t.mood.historyEmpty}
          />
        </div>

        <p className="mt-4 px-2 text-center text-xs text-text-light">
          {t.mood.historyHint}
        </p>
      </div>
    </AppLayout>
  );
}
