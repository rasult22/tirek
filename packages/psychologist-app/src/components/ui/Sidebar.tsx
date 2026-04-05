import { NavLink } from "react-router";
import { useT } from "../../hooks/useLanguage.js";
import { useQuery } from "@tanstack/react-query";
import { getActive } from "../../api/crisis.js";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  KeyRound,
  BarChart3,
  UserCircle,
  MessageSquare,
  Calendar,
  X,
} from "lucide-react";
import { directChatApi } from "../../api/direct-chat.js";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useT();

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

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: t.psychologist.dashboard },
    { to: "/students", icon: Users, label: t.psychologist.students },
    { to: "/messages", icon: MessageSquare, label: t.psychologist.messages, badge: unreadDirectCount },
    { to: "/appointments", icon: Calendar, label: t.psychologist.appointments },
    { to: "/diagnostics", icon: ClipboardList, label: t.psychologist.diagnostics },
    { to: "/crisis", icon: AlertTriangle, label: t.psychologist.crisis, badge: crisisCount },
    { to: "/invite-codes", icon: KeyRound, label: t.psychologist.inviteCodes },
    { to: "/analytics", icon: BarChart3, label: t.psychologist.analytics },
    { to: "/profile", icon: UserCircle, label: t.profile.title },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 left-0 h-full w-64 bg-surface border-r border-border z-50",
          "flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border-light">
          <span className="text-xl font-bold text-primary tracking-tight">
            Tirek
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-surface-hover text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-secondary hover:bg-surface-hover hover:text-text-main",
                )
              }
            >
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-bold rounded-full bg-danger text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-light">
          <p className="text-xs text-text-light">Tirek v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
