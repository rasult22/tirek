import { useState, useEffect, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router";
import { Sidebar } from "./Sidebar.js";

interface AppLayoutProps {
  children: ReactNode;
}

const COLLAPSED_KEY = "tirek.psy.sidebar.collapsed";

/**
 * Layout shell for psy-app web.
 * - Slim sidebar nav on the left (240px expanded → 64px rail).
 * - Multi-column friendly: `<main>` fills remaining width; pages decide
 *   their own column layout (e.g. main + side panel) inside.
 * - Below `lg` (1024px) sidebar becomes a drawer; a small top bar with a
 *   menu button replaces it. This is the mobile-like fallback.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  });
  const location = useLocation();

  // Close mobile drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore quota / private mode errors
      }
      return next;
    });
  };

  return (
    <div className="flex h-[100dvh] bg-bg">
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={handleToggleCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact top bar — only visible on <lg, hosts the menu button */}
        <header className="lg:hidden h-12 bg-surface border-b border-border-light flex items-center px-3 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-hover text-ink-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 md:px-6 md:py-5 xl:px-8 xl:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
