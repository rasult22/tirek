import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { moodApi } from "../api/mood.js";
import { moodLevels } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

const MOOD_COLORS: Record<number, string> = {
  1: "bg-red-300",
  2: "bg-orange-300",
  3: "bg-yellow-300",
  4: "bg-green-300",
  5: "bg-emerald-400",
};

const FACTOR_EMOJI: Record<string, string> = {
  school: "\uD83D\uDCDA",
  friends: "\uD83D\uDC6B",
  family: "\uD83C\uDFE0",
  health: "\uD83D\uDCAA",
  social: "\uD83D\uDCF1",
  other: "\uD83D\uDCA1",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0
}

export function MoodCalendarPage() {
  const t = useT();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const { data: calendarData } = useQuery({
    queryKey: ["mood", "calendar", monthStr],
    queryFn: () => moodApi.calendar(year, month + 1),
  });

  const { data: insights } = useQuery({
    queryKey: ["mood", "insights"],
    queryFn: moodApi.insights,
  });

  const selectedMood = useMemo(() => {
    if (!selectedDate || !calendarData) return null;
    return calendarData.find((d) => d.date === selectedDate) ?? null;
  }, [selectedDate, calendarData]);

  const moodMap = useMemo(() => {
    const map: Record<string, number> = {};
    calendarData?.forEach((d) => { map[d.date] = d.mood; });
    return map;
  }, [calendarData]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const factorLabels: Record<string, string> = {
    school: t.mood.factorSchool,
    friends: t.mood.factorFriends,
    family: t.mood.factorFamily,
    health: t.mood.factorHealth,
    social: t.mood.factorSocial,
    other: t.mood.factorOther,
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.mood.calendar}</h1>
        </div>

        {/* Month navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <ChevronLeft size={20} className="text-text-main" />
          </button>
          <h2 className="text-base font-bold text-text-main">
            {t.mood.monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <ChevronRight size={20} className="text-text-main" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {t.mood.weekdays.map((d) => (
              <span key={d} className="text-[10px] font-bold uppercase text-text-light">{d}</span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const moodVal = moodMap[dateStr];
              const isToday = dateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

              return (
                <button
                  key={day}
                  onClick={() => moodVal ? setSelectedDate(dateStr) : undefined}
                  className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    moodVal
                      ? `${MOOD_COLORS[moodVal]} text-white shadow-sm hover:scale-105`
                      : isToday
                        ? "bg-primary/10 text-primary-dark"
                        : "text-text-light hover:bg-gray-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        {insights && insights.weeklyAverage != null && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-text-light">{t.mood.weeklyAverage}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">
                  {moodLevels.find((m) => m.value === Math.round(insights.weeklyAverage))?.emoji ?? "\uD83D\uDE10"}
                </span>
                <span className="text-lg font-extrabold text-text-main">
                  {insights.weeklyAverage.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-text-light">{t.mood.trend}</p>
              <div className="mt-1 flex items-center gap-2">
                {insights.trend === "improving" && <TrendingUp size={24} className="text-secondary" />}
                {insights.trend === "declining" && <TrendingDown size={24} className="text-danger" />}
                {(insights.trend === "stable" || insights.trend === "neutral") && <Minus size={24} className="text-info" />}
                <span className="text-sm font-bold text-text-main">
                  {insights.trend === "improving" ? t.mood.trendUp : insights.trend === "declining" ? t.mood.trendDown : t.mood.trendStable}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top factors */}
        {insights && Array.isArray(insights.topFactors) && insights.topFactors.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-text-light mb-3">{t.mood.topFactors}</p>
            <div className="space-y-2">
              {insights.topFactors.map((f: { factor: string; count: number }) => (
                <div key={f.factor} className="flex items-center gap-3">
                  <span className="text-lg">{FACTOR_EMOJI[f.factor] ?? "\u2753"}</span>
                  <span className="text-sm font-medium text-text-main flex-1">
                    {factorLabels[f.factor] ?? f.factor}
                  </span>
                  <span className="text-xs font-bold text-text-light bg-gray-100 rounded-full px-2 py-0.5">
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail modal */}
        {selectedDate && selectedMood && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setSelectedDate(null)}>
            <div
              className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-main">{selectedDate}</h3>
                <button onClick={() => setSelectedDate(null)} className="text-text-light">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-4xl">
                  {moodLevels.find((m) => m.value === selectedMood.mood)?.emoji}
                </span>
                <div>
                  <p className="text-sm font-bold text-text-main">
                    {[t.mood.level1, t.mood.level2, t.mood.level3, t.mood.level4, t.mood.level5][selectedMood.mood - 1]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
