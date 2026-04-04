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
      color: "border-primary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: t.psychologist.activeToday,
      value: stats?.activeToday ?? 0,
      icon: Activity,
      color: "border-success",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: t.psychologist.pendingTests,
      value: stats?.pendingTests ?? 0,
      icon: ClipboardList,
      color: "border-warning",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: t.psychologist.crisisAlerts,
      value: stats?.crisisAlerts ?? 0,
      icon: AlertTriangle,
      color: "border-danger",
      iconBg: "bg-danger/10",
      iconColor: "text-danger",
    },
  ];

  const quickActions = [
    {
      label: t.psychologist.assignTest,
      icon: ClipboardPlus,
      to: "/diagnostics/assign",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t.psychologist.generateCodes,
      icon: KeyRound,
      to: "/invite-codes",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: t.psychologist.analytics,
      icon: BarChart3,
      to: "/analytics",
      color: "text-success",
      bg: "bg-success/10",
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">
        {t.psychologist.dashboard}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={clsx(
              "bg-white rounded-xl border-l-4 p-5 shadow-sm",
              card.color,
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-light font-medium">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-text-main mt-1">
                  {statsLoading ? (
                    <Loader2 size={24} className="animate-spin text-text-light" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  card.iconBg,
                )}
              >
                <card.icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crisis alerts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h2 className="text-base font-semibold text-text-main">
                  {t.psychologist.crisisAlerts}
                </h2>
                {(activeAlerts?.data?.length ?? 0) > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-danger text-white">
                    {activeAlerts!.data.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("/crisis")}
                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
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
                <div className="space-y-3">
                  {activeAlerts.data.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-danger/5 border border-danger/20 cursor-pointer hover:bg-danger/10 transition-colors"
                      onClick={() => navigate("/crisis")}
                    >
                      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-danger" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-main">
                          {alert.studentName ?? "Student"}
                        </p>
                        <p className="text-xs text-text-light">
                          {t.psychologist.crisisLevel} {alert.level} &middot;{" "}
                          {alert.studentGrade
                            ? `${alert.studentGrade}${alert.studentClass ?? ""}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-light">
                        <Clock size={12} />
                        {formatTimeAgo(alert.createdAt)}
                      </div>
                      <StatusBadge status="crisis" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Activity size={20} className="text-success" />
                  </div>
                  <p className="text-sm text-text-light">
                    No active crisis alerts
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions + mood overview */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-text-main mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      action.bg,
                    )}
                  >
                    <action.icon size={18} className={action.color} />
                  </div>
                  <span className="text-sm font-medium text-text-main">
                    {action.label}
                  </span>
                  <ArrowRight size={14} className="ml-auto text-text-light" />
                </button>
              ))}
            </div>
          </div>

          {/* Mood overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-text-main mb-4">
              Mood Overview
            </h2>
            {stats?.averageMood != null ? (
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {stats.averageMood >= 4
                    ? "\u{1F60A}"
                    : stats.averageMood >= 3
                      ? "\u{1F610}"
                      : stats.averageMood >= 2
                        ? "\u{1F61F}"
                        : "\u{1F622}"}
                </div>
                <p className="text-2xl font-bold text-text-main">
                  {stats.averageMood.toFixed(1)}
                </p>
                <p className="text-xs text-text-light mt-1">
                  Average student mood
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-light text-center py-4">
                {t.common.noData}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
