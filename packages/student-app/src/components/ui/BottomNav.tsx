import { NavLink, useLocation } from "react-router";
import { Home, MessageCircle, ClipboardList, Wind, Mail } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";
import { useDirectChatUnread } from "../../hooks/useDirectChatUnread.js";

const navItems = [
  { to: "/", icon: Home, labelKey: "home" as const },
  { to: "/chat/history", icon: MessageCircle, labelKey: "chat" as const },
  { to: "/messages", icon: Mail, labelKey: "messages" as const },
  { to: "/tests", icon: ClipboardList, labelKey: "tests" as const },
  { to: "/exercises", icon: Wind, labelKey: "exercises" as const },
];

export function BottomNav() {
  const t = useT();
  const unreadCount = useDirectChatUnread();
  const { pathname } = useLocation();

  const isItemActive = (item: typeof navItems[number], routerIsActive: boolean) => {
    if (item.labelKey === "chat") return pathname.startsWith("/chat");
    return routerIsActive;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-md px-3 pb-2">
        <div className="glass-card-elevated flex items-center justify-around rounded-2xl px-1 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => {
                const active = isItemActive(item, isActive);
                return `btn-press relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all ${
                  active
                    ? "bg-primary/10 text-primary-dark"
                    : "text-text-light hover:text-primary"
                }`;
              }}
            >
              {({ isActive }) => {
                const active = isItemActive(item, isActive);
                return (
                  <>
                    <div className="relative">
                      <item.icon
                        size={21}
                        strokeWidth={active ? 2.4 : 1.8}
                      />
                      {item.labelKey === "messages" && unreadCount > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger glow-danger px-1 text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{t.nav[item.labelKey]}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
