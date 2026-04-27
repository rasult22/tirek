import { NavLink } from "react-router";
import { useT } from "../../hooks/useLanguage.js";
import { useQuery } from "@tanstack/react-query";
import { getCounts } from "../../api/crisis.js";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { directChatApi } from "../../api/direct-chat.js";

export function BottomNav() {
  const t = useT();

  const { data: counts } = useQuery({
    queryKey: ["crisis", "counts"],
    queryFn: getCounts,
    refetchInterval: 30_000,
  });
  const crisisCount = counts?.red ?? 0;

  const { data: directUnread } = useQuery({
    queryKey: ["direct-chat", "unread-count"],
    queryFn: directChatApi.unreadCount,
    refetchInterval: 30_000,
  });
  const unreadDirectCount = directUnread?.count ?? 0;

  const items = [
    { to: "/", icon: LayoutDashboard, label: t.psychologist.dashboard, end: true },
    { to: "/students", icon: Users, label: t.psychologist.students },
    { to: "/messages", icon: MessageSquare, label: t.psychologist.messages, badge: unreadDirectCount },
    { to: "/crisis", icon: AlertTriangle, label: t.psychologist.crisis, badge: crisisCount },
    { to: "/diagnostics", icon: ClipboardList, label: t.psychologist.diagnostics },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border-light safe-bottom">
      <div className="flex items-stretch">
        {items.map((item) => (
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
      </div>
    </nav>
  );
}
