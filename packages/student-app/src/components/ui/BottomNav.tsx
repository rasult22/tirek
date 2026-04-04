import { NavLink } from "react-router";
import { Home, SmilePlus, MessageCircle, ClipboardList, Wind } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";

const navItems = [
  { to: "/", icon: Home, labelKey: "home" as const },
  { to: "/mood", icon: SmilePlus, labelKey: "mood" as const },
  { to: "/chat", icon: MessageCircle, labelKey: "chat" as const },
  { to: "/tests", icon: ClipboardList, labelKey: "tests" as const },
  { to: "/exercises", icon: Wind, labelKey: "exercises" as const },
];

export function BottomNav() {
  const t = useT();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "text-primary-dark"
                  : "text-text-light hover:text-primary-dark"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-primary-dark" : ""}
                />
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
