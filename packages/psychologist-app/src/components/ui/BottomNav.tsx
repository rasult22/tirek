import { NavLink } from "react-router";
import { useT } from "../../hooks/useLanguage.js";
import { useQuery } from "@tanstack/react-query";
import { getActive } from "../../api/crisis.js";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { directChatApi } from "../../api/direct-chat.js";
import { useState } from "react";
import {
  ClipboardList,
  KeyRound,
  BarChart3,
  UserCircle,
  Calendar,
  X,
} from "lucide-react";

export function BottomNav() {
  const t = useT();
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: activeAlerts } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: getActive,
    refetchInterval: 30_000,
  });
  const crisisCount = activeAlerts?.data?.length ?? 0;

  const { data: directUnread } = useQuery({
    queryKey: ["direct-chat", "unread-count"],
    queryFn: directChatApi.unreadCount,
    refetchInterval: 30_000,
  });
  const unreadDirectCount = directUnread?.count ?? 0;

  const primaryItems = [
    { to: "/", icon: LayoutDashboard, label: t.psychologist.dashboard, end: true },
    { to: "/students", icon: Users, label: t.psychologist.students },
    { to: "/messages", icon: MessageSquare, label: t.psychologist.messages, badge: unreadDirectCount },
    { to: "/crisis", icon: AlertTriangle, label: t.psychologist.crisis, badge: crisisCount },
  ];

  const moreItems = [
    { to: "/appointments", icon: Calendar, label: t.psychologist.appointments },
    { to: "/diagnostics", icon: ClipboardList, label: t.psychologist.diagnostics },
    { to: "/invite-codes", icon: KeyRound, label: t.psychologist.inviteCodes },
    { to: "/analytics", icon: BarChart3, label: t.psychologist.analytics },
    { to: "/profile", icon: UserCircle, label: t.profile.title },
  ];

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2">
            <div className="glass-card-elevated rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                <span className="text-sm font-bold text-text-main">
                  {t.common.more}
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label={t.common.close}
                  className="p-2 hover:bg-surface-hover rounded-lg"
                >
                  <X size={16} className="text-text-light" />
                </button>
              </div>
              <nav className="py-1">
                {moreItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-text-main hover:bg-surface-hover",
                      )
                    }
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border-light safe-bottom">
        <div className="flex items-stretch">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              className={({ isActive }) =>
                clsx(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-text-light",
                )
              }
            >
              <div className="relative">
                <item.icon size={22} strokeWidth={1.8} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-bold rounded-full bg-danger text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-tight text-center">{item.label}</span>
            </NavLink>
          ))}

          {/* More button */}
          <button
            aria-label={t.common.more}
            onClick={() => setMoreOpen(!moreOpen)}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
              moreOpen ? "text-primary" : "text-text-light",
            )}
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[11px] font-medium leading-tight text-center">
              {t.common.more}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
