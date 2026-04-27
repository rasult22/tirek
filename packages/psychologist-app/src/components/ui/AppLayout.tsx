import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { BottomNav } from "./BottomNav.js";
import { useAuthStore } from "../../store/auth-store.js";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] bg-bg">
      {/* Compact mobile header */}
      <header className="h-12 glass-card-elevated border-b border-border-light flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
            <span className="text-xs font-extrabold text-white">T</span>
          </div>
          <span className="text-base font-bold tracking-tight text-text-main">
            Tirek
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* User avatar */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Profile"
            onClick={() => navigate("/profile")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/profile")}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
          </div>
        </div>
      </header>

      {/* Main content — pb-16 for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
