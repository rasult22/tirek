import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, ArrowRight, UserCircle } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { directChatApi } from "../api/direct-chat.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import type { Conversation } from "@tirek/shared";

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
  const queryClient = useQueryClient();

  const { data: convData, isLoading, isError, refetch } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
    refetchInterval: 30_000,
  });

  const { data: psychologist } = useQuery({
    queryKey: ["direct-chat", "my-psychologist"],
    queryFn: directChatApi.myPsychologist,
  });

  const startMutation = useMutation({
    mutationFn: (psychologistId: string) =>
      directChatApi.createConversation(psychologistId),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
      navigate(`/messages/${conv.id}`);
    },
  });

  const conversations = convData?.data ?? [];

  if (isError) {
    return (
      <AppLayout>
        <ErrorState onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 pb-6">
        <h1 className="text-xl font-bold text-text-main">{t.directChat.title}</h1>

        {isLoading && (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail size={28} className="text-primary" />
            </div>
            <p className="text-sm text-text-light">{t.directChat.noConversations}</p>
            {psychologist && (
              <button
                onClick={() => startMutation.mutate(psychologist.id)}
                disabled={startMutation.isPending}
                className="mt-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {t.directChat.writeToYourPsychologist}
              </button>
            )}
            {!psychologist && (
              <p className="text-xs text-text-light">{t.directChat.noPsychologist}</p>
            )}
          </div>
        )}

        {!isLoading && conversations.length > 0 && (
          <div className="mt-4 space-y-2">
            {conversations.map((conv: Conversation) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
                  <UserCircle size={24} className="text-primary-dark" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-main">
                      {conv.otherUser.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-text-light">
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
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-dark px-1.5 text-[11px] font-bold text-white">
                    {conv.unreadCount}
                  </span>
                )}
                <ArrowRight size={16} className="text-text-light" />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
