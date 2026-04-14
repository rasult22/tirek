import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ClipboardList, Wind, CalendarDays, Calendar, CheckCircle2, Sparkles, Flame, BookOpen, Trophy, Mail, Award } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { moodApi } from "../api/mood.js";
import { contentApi } from "../api/content.js";
import { streaksApi } from "../api/streaks.js";
import { plantApi } from "../api/plant.js";
import { exercisesApi } from "../api/exercises.js";
import { appointmentsApi } from "../api/appointments.js";
import { achievementsApi } from "../api/achievements.js";
import { testsApi } from "../api/tests.js";
import { moodLevels } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": "\u{1F60A}",
  "avatar-2": "\u{1F929}",
  "avatar-3": "\u{1F98A}",
  "avatar-4": "\u{1F431}",
  "avatar-5": "\u{1F680}",
  "avatar-6": "\u{1F33B}",
};

export function DashboardPage() {
  const t = useT();
  const { language } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const { data: todayMood, isError, refetch } = useQuery({
    queryKey: ["mood", "today"],
    queryFn: moodApi.today,
  });

  const { data: quote } = useQuery({
    queryKey: ["quote"],
    queryFn: contentApi.quoteOfTheDay,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: streaksApi.get,
  });

  const { data: plant } = useQuery({
    queryKey: ["plant"],
    queryFn: plantApi.get,
  });

  const { data: stats } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: exercisesApi.stats,
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ["appointments", "next"],
    queryFn: appointmentsApi.next,
  });

  const { data: achievementsSummary } = useQuery({
    queryKey: ["achievements-summary"],
    queryFn: achievementsApi.getSummary,
  });

  const { data: assignedTests = [] } = useQuery({
    queryKey: ["tests", "assigned"],
    queryFn: () => testsApi.assigned(),
  });

  const pendingTestsCount = assignedTests.filter(
    (a) => a.status !== "completed",
  ).length;

  const quickLinks = [
    { to: "/chat", icon: MessageCircle, label: t.nav.chat, iconBg: "bg-teal-100", color: "text-teal-700", badge: 0 },
    { to: "/tests", icon: ClipboardList, label: t.nav.tests, iconBg: "bg-emerald-100", color: "text-emerald-700", badge: pendingTestsCount },
    { to: "/exercises", icon: Wind, label: t.nav.exercises, iconBg: "bg-sky-100", color: "text-sky-700", badge: 0 },
    { to: "/journal", icon: BookOpen, label: t.nav.journal, iconBg: "bg-amber-100", color: "text-amber-700", badge: 0 },
    { to: "/messages", icon: Mail, label: t.directChat.title, iconBg: "bg-green-100", color: "text-green-700", badge: 0 },
    { to: "/mood/calendar", icon: CalendarDays, label: t.mood.calendar, iconBg: "bg-blue-100", color: "text-blue-700", badge: 0 },
    { to: "/appointments", icon: Calendar, label: t.nav.appointments, iconBg: "bg-violet-100", color: "text-violet-700", badge: 0 },
    { to: "/achievements", icon: Award, label: t.achievements.title, iconBg: "bg-yellow-100", color: "text-yellow-700", badge: 0 },
  ];

  const avatarEmoji = user?.avatarId ? (AVATAR_MAP[user.avatarId] ?? "\u{1F60A}") : "\u{1F60A}";

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-8">
        {/* Greeting */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-extrabold text-text-main tracking-tight">
              {t.dashboard.greeting}, {user?.name?.split(" ")[0] ?? ""}!
            </h1>
            <p className="mt-1 text-sm text-text-light">{t.dashboard.howAreYou}</p>
          </div>
          <Link
            to="/profile"
            className="btn-press flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-xl shadow-sm transition-shadow hover:shadow-md"
          >
            {avatarEmoji}
          </Link>
        </div>

        {/* Mood check-in widget */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          {todayMood ? (
            <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
                <CheckCircle2 size={20} className="text-secondary" />
              </div>
              <span className="flex-1 text-sm font-bold text-text-main">{t.dashboard.moodDone}</span>
              <span className="text-3xl drop-shadow-sm">
                {moodLevels.find((m) => m.value === todayMood.mood)?.emoji ?? "\u{1F610}"}
              </span>
            </div>
          ) : (
            <Link
              to="/mood"
              className="btn-press group glass-card-elevated flex items-center justify-between rounded-2xl px-5 py-5 transition-all hover:shadow-lg"
            >
              <div>
                <p className="text-base font-bold text-text-main">{t.dashboard.moodCheckin}</p>
                <p className="mt-0.5 text-xs text-text-light">{t.dashboard.howAreYou}</p>
              </div>
              <div className="flex gap-1.5 transition-transform group-hover:scale-105">
                {moodLevels.map((m) => (
                  <span key={m.value} className="text-2xl drop-shadow-sm">{m.emoji}</span>
                ))}
              </div>
            </Link>
          )}
        </div>

        <div className="stagger-children mt-5 space-y-4">
          {/* Streak widget */}
          {streak && streak.currentStreak > 0 && (
            <div className="glass-card flex items-center gap-4 rounded-2xl p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                <Flame size={26} className="text-orange-500 drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-orange-600">{streak.currentStreak}</span>
                  <span className="text-sm font-semibold text-orange-600">{t.dashboard.streak}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                  <Trophy size={11} />
                  {t.dashboard.streakRecord}: {streak.longestStreak}
                </div>
              </div>
            </div>
          )}

          {/* Plant widget */}
          {plant && (
            <Link
              to="/plant"
              className={`btn-press glass-card flex items-center gap-4 rounded-2xl p-4 transition-all hover:shadow-md ${
                plant.isSleeping ? "opacity-70 grayscale-[30%]" : ""
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-2xl">
                {plant.stage === 1 ? "\u{1F331}" : plant.stage === 2 ? "\u{1F33F}" : plant.stage === 3 ? "\u{1F333}" : "\u{1F338}"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-text-main">
                  {plant.name ?? t.plant.unnamed}
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-green-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 ease-out"
                    style={{
                      width: `${plant.stage >= 4 ? 100 : Math.max(Math.round(((plant.growthPoints - [0, 50, 150, 300][plant.stage - 1]) / (plant.nextStageThreshold - [0, 50, 150, 300][plant.stage - 1])) * 100), 3)}%`,
                    }}
                  />
                </div>
                <div className="mt-0.5 text-xs text-text-light">
                  {plant.isSleeping
                    ? `\u{1F4A4} ${t.plant.sleeping}`
                    : plant.stage >= 4
                      ? t.plant.maxStage
                      : `${t.plant.pointsToNext}: ${plant.pointsToNextStage}`}
                </div>
              </div>
            </Link>
          )}

          {/* Achievements widget */}
          {achievementsSummary && achievementsSummary.totalCount > 0 && (
            <Link
              to="/achievements"
              className="btn-press glass-card flex items-center gap-4 rounded-2xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100">
                {achievementsSummary.recentAchievements.length > 0 ? (
                  <span className="text-2xl drop-shadow-sm">{achievementsSummary.recentAchievements[0].achievement.emoji}</span>
                ) : (
                  <Award size={26} className="text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-700">
                  {t.achievements.title}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-yellow-600">
                    {achievementsSummary.earnedCount}
                  </span>
                  <span className="text-sm text-yellow-600 font-semibold">
                    / {achievementsSummary.totalCount}
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Next appointment widget */}
          {nextAppointment && (
            <Link
              to="/appointments"
              className="btn-press glass-card flex items-center gap-4 rounded-2xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                <CalendarDays size={26} className="text-violet-500" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                  {t.appointments.nextAppointment}
                </div>
                <div className="mt-0.5 text-sm font-bold text-text-main">
                  {nextAppointment.date} &middot; {nextAppointment.startTime}&ndash;{nextAppointment.endTime}
                </div>
                <div className="text-xs text-text-light">{nextAppointment.psychologistName}</div>
              </div>
            </Link>
          )}
        </div>

        {/* Quote of the day */}
        {quote && (
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="rounded-2xl bg-white border border-border-light p-5 shadow-sm">
              <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-dark">
                <Sparkles size={13} />
                {t.dashboard.quoteOfTheDay}
              </div>
              <p className="text-sm font-medium italic leading-relaxed text-text-main">
                &ldquo;{language === "kz" && quote.textKz ? quote.textKz : quote.textRu}&rdquo;
              </p>
              {quote.author && (
                <p className="mt-2.5 text-right text-xs font-semibold text-text-light">&mdash; {quote.author}</p>
              )}
            </div>
          </div>
        )}

        {/* Progress stats */}
        {stats && (stats.exercisesCompleted > 0 || stats.testsCompleted > 0 || stats.journalEntries > 0) && (
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-light">
              {t.dashboard.progress}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Wind, value: stats.exercisesCompleted, label: t.dashboard.exercisesDone, color: "text-teal-700", iconBg: "bg-teal-100" },
                { icon: ClipboardList, value: stats.testsCompleted, label: t.dashboard.testsPassed, color: "text-emerald-700", iconBg: "bg-emerald-100" },
                { icon: BookOpen, value: stats.journalEntries, label: t.dashboard.journalEntries, color: "text-amber-700", iconBg: "bg-amber-100" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center rounded-2xl bg-white border border-border-light p-3.5 shadow-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.iconBg}`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <span className="mt-1.5 text-xl font-extrabold text-text-main">{item.value}</span>
                  <span className="mt-0.5 text-center text-[10px] leading-tight text-text-light">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick access grid */}
        <div className="mt-6 mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-light">
            {t.dashboard.quickAccess}
          </h2>
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="btn-press relative flex flex-col items-center gap-2.5 rounded-2xl bg-white p-5 shadow-sm border border-border-light transition-all hover:shadow-md"
              >
                <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <item.icon size={22} className={item.color} />
                  {item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-text-main">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
