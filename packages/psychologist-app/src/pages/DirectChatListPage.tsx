import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, ArrowRight, UserCircle } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { directChatApi } from "../api/direct-chat.js";
import type { Conversation } from "@tirek/shared";
import { ErrorState } from "../components/ui/ErrorState.js";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function DirectChatListPage() {
  const t = useT();
  const navigate = useNavigate();

  const { data: convData, isLoading, isError, refetch } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
    refetchInterval: 30_000,
  });

  const conversations = convData?.data ?? [];

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-main">{t.directChat.title}</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail size={24} className="text-primary" />
          </div>
          <p className="text-sm text-text-light">{t.directChat.noConversations}</p>
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conv: Conversation) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                {conv.otherUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-main truncate">
                    {conv.otherUser.name}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-[11px] text-text-light shrink-0">
                      {formatTime(conv.lastMessage.createdAt as string)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-text-light">
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shrink-0">
                  {conv.unreadCount}
                </span>
              )}
              <ArrowRight size={16} className="text-text-light shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
