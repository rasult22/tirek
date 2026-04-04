import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, getUnreadCount, markRead } from "../../api/notifications.js";
import { useAuthStore } from "../../store/auth-store.js";
import { Bell, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import type { Notification } from "@tirek/shared";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: notifOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });

  const unreadCount = unread?.count ?? 0;

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-secondary"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-secondary transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-danger text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-main">
                        Notifications
                      </span>
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {notifications && notifications.data.length > 0 ? (
                      notifications.data.slice(0, 20).map((n: Notification) => (
                        <div
                          key={n.id}
                          className={clsx(
                            "px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer",
                            !n.read && "bg-primary/5",
                          )}
                          onClick={() => {
                            if (!n.read) markReadMutation.mutate(n.id);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={clsx(
                                "mt-1 w-2 h-2 rounded-full shrink-0",
                                n.type === "crisis" && "bg-danger",
                                n.type === "reminder" && "bg-warning",
                                n.type === "assignment" && "bg-primary",
                                n.type === "system" && "bg-secondary",
                              )}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-main truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-text-light mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                              <p className="text-[10px] text-text-light mt-1">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-text-light">
                        No notifications
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-text-main">
                {user?.name ?? "Psychologist"}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
