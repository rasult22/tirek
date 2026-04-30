import { NavLink, useNavigate } from "react-router";
import { useT } from "../../hooks/useLanguage.js";
import { useQuery } from "@tanstack/react-query";
import { getCounts } from "../../api/crisis.js";
import { clsx } from "clsx";
import logoSrc from "../../assets/logo.png";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { directChatApi } from "../../api/direct-chat.js";
import { useAuthStore } from "../../store/auth-store.js";

interface SidebarProps {
  /** Mobile drawer open state (used below `lg` breakpoint). */
  open: boolean;
  onClose: () => void;
  /** Desktop collapsed (rail) state. 240px → 64px. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * Slim left sidebar nav for psy-app web.
 * - 240px expanded → 64px collapsed (rail) on `lg+`.
 * - On `<lg` viewports renders as a drawer controlled by `open`.
 * - 5 nav items: Главная / Ученики / Сообщения / Кризисы / Диагностика.
 * - Profile entry pinned at bottom (drawer-вход).
 */
export function Sidebar({ open, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: t.psychologist.dashboard, end: true },
    { to: "/students", icon: Users, label: t.psychologist.students },
    { to: "/messages", icon: MessageSquare, label: t.psychologist.messages, badge: unreadDirectCount },
    { to: "/crisis", icon: AlertTriangle, label: t.psychologist.crisis, badge: crisisCount },
    { to: "/diagnostics", icon: ClipboardList, label: t.psychologist.diagnostics },
  ];

  const handleProfileClick = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 left-0 h-full z-50 flex flex-col",
          "bg-surface border-r border-border-light",
          "transition-[transform,width] duration-200 ease-out",
          // Mobile: 240px drawer that slides in/out
          "w-[240px]",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, width depends on collapsed state
          "lg:translate-x-0 lg:static lg:z-auto",
          collapsed ? "lg:w-[64px]" : "lg:w-[240px]",
        )}
        aria-label="Primary navigation"
      >
        {/* Logo / brand */}
        <div
          className={clsx(
            "flex items-center h-16 border-b border-border-light shrink-0",
            collapsed ? "lg:justify-center lg:px-0" : "lg:px-5",
            "px-5 justify-between",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoSrc}
              alt="Tirek"
              className="h-8 w-8 rounded-lg shadow-md shadow-brand/25 shrink-0"
            />
            <span
              className={clsx(
                "text-lg font-bold tracking-tight text-ink truncate",
                collapsed && "lg:hidden",
              )}
            >
              Tirek
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-hover text-ink-muted transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={clsx(
            "flex-1 py-3 space-y-0.5 overflow-y-auto",
            collapsed ? "lg:px-2" : "lg:px-3",
            "px-3",
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  "btn-press relative flex items-center rounded-xl text-[13px] font-semibold transition-colors",
                  collapsed
                    ? "lg:justify-center lg:px-0 lg:py-2.5"
                    : "lg:gap-3 lg:px-3 lg:py-2.5",
                  "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-brand-soft text-brand-deep"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                )
              }
            >
              <span className="relative flex items-center justify-center shrink-0">
                <item.icon size={19} strokeWidth={1.8} />
                {collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="hidden lg:flex absolute -top-1 -right-1 min-w-[16px] h-4 items-center justify-center px-1 text-[9px] font-bold rounded-full bg-danger text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  "flex-1 truncate",
                  collapsed && "lg:hidden",
                )}
              >
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={clsx(
                    "min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold rounded-full bg-danger text-white",
                    collapsed && "lg:hidden",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapsed}
          className={clsx(
            "hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-xl",
            "text-[12px] font-medium text-ink-muted hover:bg-surface-hover hover:text-ink",
            "transition-colors",
            collapsed && "lg:justify-center lg:px-0 lg:mx-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && <span>Свернуть</span>}
        </button>

        {/* Profile entry (drawer-вход) */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={clsx(
            "flex items-center gap-3 border-t border-border-light shrink-0 transition-colors",
            "hover:bg-surface-hover",
            collapsed ? "lg:justify-center lg:px-2 lg:py-3" : "lg:px-4 lg:py-3",
            "px-4 py-3",
          )}
          aria-label="Open profile"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand/20 to-secondary/15 text-brand-deep flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
          </div>
          <div
            className={clsx(
              "min-w-0 text-left",
              collapsed && "lg:hidden",
            )}
          >
            <div className="text-[13px] font-semibold text-ink truncate">
              {user?.name ?? "Профиль"}
            </div>
            <div className="text-[11px] text-ink-muted truncate">
              {user?.email ?? ""}
            </div>
          </div>
        </button>
      </aside>
    </>
  );
}
