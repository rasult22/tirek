import { NavLink } from "react-router";
import { Home, SmilePlus, MessageCircle, ClipboardList, Wind, Mail } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";
import { useDirectChatUnread } from "../../hooks/useDirectChatUnread.js";

const navItems = [
  { to: "/", icon: Home, labelKey: "home" as const },
  { to: "/mood", icon: SmilePlus, labelKey: "mood" as const },
  { to: "/chat", icon: MessageCircle, labelKey: "chat" as const },
  { to: "/messages", icon: Mail, labelKey: "messages" as const },
  { to: "/tests", icon: ClipboardList, labelKey: "tests" as const },
  { to: "/exercises", icon: Wind, labelKey: "exercises" as const },
];

export function BottomNav() {
  const t = useT();
  const unreadCount = useDirectChatUnread();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "text-primary-dark"
                  : "text-text-light hover:text-primary-dark"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? "text-primary-dark" : ""}
                  />
                  {item.labelKey === "messages" && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>{t.nav[item.labelKey]}</span>
                {isActive && (
                  <span className="absolute -bottom-0 h-0.5 w-6 rounded-full bg-primary-dark" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
