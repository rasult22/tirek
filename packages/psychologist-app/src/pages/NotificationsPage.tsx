import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, getUnreadCount, markRead } from "../api/notifications.js";
import { Bell, ArrowLeft } from "lucide-react";
import { clsx } from "clsx";
import type { Notification } from "@tirek/shared";
import { ErrorState } from "../components/ui/ErrorState.js";
import { useT } from "../hooks/useLanguage.js";

const typeIcons: Record<string, { emoji: string; bg: string }> = {
  crisis_red: { emoji: "🚨", bg: "bg-danger/10" },
  concern_yellow: { emoji: "⚠️", bg: "bg-yellow-400/15" },
  crisis: { emoji: "🚨", bg: "bg-danger/10" },
  sos_alert: { emoji: "🆘", bg: "bg-danger/10" },
  concern_detected: { emoji: "⚠️", bg: "bg-warning/10" },
  reminder: { emoji: "🔔", bg: "bg-warning/10" },
  assignment: { emoji: "📋", bg: "bg-primary/10" },
  direct_message: { emoji: "💬", bg: "bg-success/10" },
  system: { emoji: "ℹ️", bg: "bg-secondary/10" },
};

type FilterValue = "all" | "crisis_red" | "concern_yellow" | "info" | "chat";

// Backend already normalizes any legacy types to canonical ones
// (crisis_red | concern_yellow | info | chat), so filtering is direct.
function matchesFilter(n: Notification, filter: FilterValue): boolean {
  if (filter === "all") return true;
  return n.type === filter;
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} д назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();
  const [filter, setFilter] = useState<FilterValue>("all");

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { data: unread } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: getUnreadCount,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });

  const unreadCount = unread?.count ?? 0;

  function handleTap(n: Notification) {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.type === "chat" && n.metadata?.conversationId) {
      navigate(`/messages/${n.metadata.conversationId}`);
    } else if (n.type === "crisis_red" || n.type === "concern_yellow") {
      navigate("/crisis");
    }
  }

  const allItems = notifications?.data ?? [];
  const items = allItems.filter((n) => matchesFilter(n, filter));

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  function dateGroup(dateStr: string): string {
    const d = new Date(dateStr).toDateString();
    if (d === today) return "Сегодня";
    if (d === yesterday) return "Вчера";
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  }

  const grouped: { label: string; items: Notification[] }[] = [];
  for (const item of items) {
    const label = dateGroup(item.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      grouped.push({ label, items: [item] });
    }
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const filterButtons: Array<{ value: FilterValue; label: string }> = [
    { value: "all", label: t.psychologist.notificationFilterAll },
    { value: "crisis_red", label: t.psychologist.notificationFilterCrisisRed },
    {
      value: "concern_yellow",
      label: t.psychologist.notificationFilterConcernYellow,
    },
    { value: "info", label: t.psychologist.notificationFilterInfo },
    { value: "chat", label: t.psychologist.notificationFilterChat },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
          >
            <ArrowLeft size={18} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">Уведомления</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-danger text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
        {filterButtons.map((b) => (
          <button
            key={b.value}
            onClick={() => setFilter(b.value)}
            className={clsx(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === b.value
                ? "bg-primary text-white"
                : "bg-surface-secondary text-text-light",
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3">
            <Bell size={28} className="text-text-light" />
          </div>
          <p className="text-sm font-medium text-text-main">Нет уведомлений</p>
          <p className="text-xs text-text-light mt-1">Новые уведомления появятся здесь</p>
        </div>
      )}

      {/* Grouped notifications */}
      {!isLoading && grouped.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-bold text-text-light uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="space-y-1.5">
            {group.items.map((n) => {
              const icon = typeIcons[n.type] ?? typeIcons.system!;
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={clsx(
                    "btn-press w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all",
                    !n.read
                      ? "bg-primary/4 border border-primary/10"
                      : "bg-surface border border-border hover:bg-surface-hover",
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg",
                    icon.bg,
                  )}>
                    {icon.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx(
                        "text-sm leading-tight",
                        !n.read ? "font-bold text-text-main" : "font-medium text-text-main",
                      )}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-text-light shrink-0 mt-0.5">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-light mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                  </div>

                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
