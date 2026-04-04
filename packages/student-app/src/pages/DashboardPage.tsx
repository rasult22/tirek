import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ClipboardList, Wind, CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { moodApi } from "../api/mood.js";
import { contentApi } from "../api/content.js";
import { moodLevels } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

export function DashboardPage() {
  const t = useT();
  const { language } = useLanguage();
  const user = useAuthStore((s) => s.user);

  const { data: todayMood } = useQuery({
    queryKey: ["mood", "today"],
    queryFn: moodApi.today,
  });

  const { data: quote } = useQuery({
    queryKey: ["quote"],
    queryFn: contentApi.quoteOfTheDay,
  });

  const quickLinks = [
    { to: "/chat", icon: MessageCircle, label: t.nav.chat, bg: "bg-primary/15", color: "text-primary-dark" },
    { to: "/tests", icon: ClipboardList, label: t.nav.tests, bg: "bg-secondary/20", color: "text-secondary" },
    { to: "/exercises", icon: Wind, label: t.nav.exercises, bg: "bg-accent/20", color: "text-accent" },
    { to: "/mood/calendar", icon: CalendarDays, label: t.mood.calendar, bg: "bg-info/20", color: "text-info" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-8">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text-main">
              {t.dashboard.greeting}, {user?.name?.split(" ")[0] ?? ""}!
            </h1>
            <p className="mt-0.5 text-sm text-text-light">{t.dashboard.howAreYou}</p>
          </div>
          <Link to="/profile" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-lg">
            {user?.avatarId ? (
              <span className="text-xl">
                {user.avatarId === "avatar-1" ? "\uD83D\uDE0A" :
                 user.avatarId === "avatar-2" ? "\uD83E\uDD29" :
                 user.avatarId === "avatar-3" ? "\uD83E\uDD8A" :
                 user.avatarId === "avatar-4" ? "\uD83D\uDC31" :
                 user.avatarId === "avatar-5" ? "\uD83D\uDE80" : "\uD83C\uDF3B"}
              </span>
            ) : (
              <span className="text-xl">\uD83D\uDE0A</span>
            )}
          </Link>
        </div>

        {/* Quote of the day */}
        {quote && (
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-dark">
              <Sparkles size={14} />
              {t.dashboard.quoteOfTheDay}
            </div>
            <p className="text-sm font-medium italic leading-relaxed text-text-main">
              &ldquo;{language === "kz" && quote.textKz ? quote.textKz : quote.textRu}&rdquo;
            </p>
            {quote.author && (
              <p className="mt-2 text-right text-xs text-text-light">&mdash; {quote.author}</p>
            )}
          </div>
        )}

        {/* Mood check-in widget */}
        <div className="mt-5">
          {todayMood ? (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/15 px-5 py-4">
              <CheckCircle2 size={22} className="text-secondary" />
              <span className="text-sm font-bold text-text-main">{t.dashboard.moodDone}</span>
              <span className="ml-auto text-2xl">
                {moodLevels.find((m) => m.value === todayMood.mood)?.emoji ?? "\uD83D\uDE10"}
              </span>
            </div>
          ) : (
            <Link
              to="/mood"
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-accent/30 to-accent/10 px-5 py-4 transition-shadow hover:shadow-md"
            >
              <div>
                <p className="text-sm font-bold text-text-main">{t.dashboard.moodCheckin}</p>
                <p className="mt-0.5 text-xs text-text-light">{t.dashboard.howAreYou}</p>
              </div>
              <div className="flex gap-1">
                {moodLevels.map((m) => (
                  <span key={m.value} className="text-xl">{m.emoji}</span>
                ))}
              </div>
            </Link>
          )}
        </div>

        {/* Quick access grid */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-light">
            {t.dashboard.quickAccess}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                  <item.icon size={24} className={item.color} />
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
