import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { overview } from "../api/analytics.js";
import { getActive } from "../api/crisis.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import {
  Users,
  Activity,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  ClipboardPlus,
  KeyRound,
  BarChart3,
  Clock,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

export function DashboardPage() {
  const t = useT();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: overview,
  });

  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: getActive,
    refetchInterval: 30_000,
  });

  const statCards = [
    {
      label: t.psychologist.totalStudents,
      value: stats?.totalStudents ?? 0,
      icon: Users,
      gradient: "from-blue-50 to-sky-50",
      iconBg: "bg-primary/12",
      iconColor: "text-primary",
    },
    {
      label: t.psychologist.activeToday,
      value: stats?.activeToday ?? 0,
      icon: Activity,
      gradient: "from-emerald-50 to-green-50",
      iconBg: "bg-success/12",
      iconColor: "text-success",
    },
    {
      label: t.psychologist.pendingTests,
      value: stats?.pendingTests ?? 0,
      icon: ClipboardList,
      gradient: "from-amber-50 to-yellow-50",
      iconBg: "bg-warning/12",
      iconColor: "text-warning",
    },
    {
      label: t.psychologist.crisisAlerts,
      value: stats?.crisisAlerts ?? 0,
      icon: AlertTriangle,
      gradient: "from-red-50 to-rose-50",
      iconBg: "bg-danger/12",
      iconColor: "text-danger",
    },
  ];

  const quickActions = [
    {
      label: t.psychologist.assignTest,
      icon: ClipboardPlus,
      to: "/diagnostics/assign",
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: t.psychologist.generateCodes,
      icon: KeyRound,
      to: "/invite-codes",
      color: "text-warning",
      bg: "bg-warning/8",
    },
    {
      label: t.psychologist.analytics,
      icon: BarChart3,
      to: "/analytics",
      color: "text-success",
      bg: "bg-success/8",
    },
  ];

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "<1m";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold tracking-tight text-text-main">
        {t.psychologist.dashboard}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={clsx(
              "glass-card rounded-2xl p-5 bg-gradient-to-br",
              card.gradient,
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-text-light">
                  {card.label}
                </p>
                <p className="text-3xl font-extrabold text-text-main mt-2">
                  {statsLoading ? (
                    <Loader2 size={24} className="animate-spin text-text-light" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className={clsx(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  card.iconBg,
                )}
              >
                <card.icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Crisis alerts */}
        <div className="lg:col-span-2">
          <div className="glass-card-elevated rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10">
                  <AlertTriangle size={16} className="text-danger" />
                </div>
                <h2 className="text-base font-bold text-text-main">
                  {t.psychologist.crisisAlerts}
                </h2>
                {(activeAlerts?.data?.length ?? 0) > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-danger text-white">
                    {activeAlerts!.data.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("/crisis")}
                className="btn-press text-sm text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="p-5">
              {alertsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-text-light" />
                </div>
              ) : activeAlerts && activeAlerts.data.length > 0 ? (
                <div className="space-y-2.5">
                  {activeAlerts.data.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="btn-press flex items-center gap-4 p-3.5 rounded-xl bg-danger/4 border border-danger/12 cursor-pointer hover:bg-danger/8 transition-all"
                      onClick={() => navigate("/crisis")}
                    >
                      <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-danger" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-main">
                          {alert.studentName ?? "Student"}
                        </p>
                        <p className="text-xs text-text-light">
                          {t.psychologist.crisisLevel} {alert.level} &middot;{" "}
                          {alert.studentGrade
                            ? `${alert.studentGrade}${alert.studentClass ?? ""}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-light font-medium">
                        <Clock size={12} />
                        {formatTimeAgo(alert.createdAt)}
                      </div>
                      <StatusBadge status="crisis" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Activity size={22} className="text-success" />
                  </div>
                  <p className="text-sm text-text-light font-medium">
                    No active crisis alerts
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions + mood overview */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="glass-card-elevated rounded-2xl p-5">
            <h2 className="text-base font-bold text-text-main mb-4">
              {t.psychologist.quickActions}
            </h2>
            <div className="space-y-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="btn-press w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-all text-left"
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      action.bg,
                    )}
                  >
                    <action.icon size={18} className={action.color} />
                  </div>
                  <span className="text-sm font-semibold text-text-main">
                    {action.label}
                  </span>
                  <ArrowRight size={14} className="ml-auto text-text-light/50" />
                </button>
              ))}
            </div>
          </div>

          {/* Mood overview */}
          <div className="glass-card-elevated rounded-2xl p-5">
            <h2 className="text-base font-bold text-text-main mb-4">
              {t.psychologist.moodOverview}
            </h2>
            {stats?.averageMood != null ? (
              <div className="text-center">
                <div className="text-5xl mb-2 drop-shadow-sm">
                  {stats.averageMood >= 4
                    ? "\u{1F60A}"
                    : stats.averageMood >= 3
                      ? "\u{1F610}"
                      : stats.averageMood >= 2
                        ? "\u{1F61F}"
                        : "\u{1F622}"}
                </div>
                <p className="text-3xl font-extrabold text-text-main">
                  {stats.averageMood.toFixed(1)}
                </p>
                <p className="text-xs text-text-light mt-1 font-medium">
                  Average student mood
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-light text-center py-6">
                {t.common.noData}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
