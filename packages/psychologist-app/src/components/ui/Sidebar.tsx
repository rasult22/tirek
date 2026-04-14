import { NavLink } from "react-router";
import { useT } from "../../hooks/useLanguage.js";
import { useQuery } from "@tanstack/react-query";
import { getActive } from "../../api/crisis.js";
import { clsx } from "clsx";
import logoSrc from "../../assets/logo.png";
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
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 left-0 h-full w-64 z-50",
          "flex flex-col transition-transform duration-200",
          "bg-surface/95 backdrop-blur-xl border-r border-border-light",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <img src={logoSrc} alt="Tirek" className="h-8 w-8 rounded-lg shadow-md shadow-primary/25" />
            <span className="text-lg font-bold tracking-tight text-text-main">
              Tirek
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-hover text-text-light transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                  isActive
                    ? "bg-primary/10 text-primary-dark shadow-sm"
                    : "text-text-light hover:bg-surface-hover hover:text-text-main",
                )
              }
            >
              <item.icon size={19} strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold rounded-full bg-danger text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-light">
          <p className="text-[11px] text-text-light/60 font-medium">Tirek v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
