import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mail, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { directChatApi } from "../api/direct-chat.js";
import type { Conversation, DirectMessage } from "@tirek/shared";
import { ErrorState } from "../components/ui/ErrorState.js";
import { clsx } from "clsx";

function formatListTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday)
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Сегодня";
  if (isYesterday) return "Вчера";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function DirectChatListPage() {
  const t = useT();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const {
    data: convData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
    refetchInterval: 30_000,
  });

  const conversations = convData?.data ?? [];

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const activeConv = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : undefined;

  return (
    <div
      className="flex -mx-4 -my-4 md:-mx-6 md:-my-5 xl:-mx-8 xl:-my-6"
      style={{ height: "calc(100dvh - 3rem)" }}
    >
      {/* List column */}
      <aside
        className={clsx(
          "w-full lg:w-[320px] lg:shrink-0 border-r border-border-light bg-surface flex flex-col",
          conversationId ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="px-4 py-3 border-b border-border-light shrink-0">
          <h1 className="text-base font-bold text-text-main">
            {t.directChat.title}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail size={20} className="text-primary" />
              </div>
              <p className="text-sm text-text-light">
                {t.directChat.noConversations}
              </p>
            </div>
          )}

          {!isLoading && conversations.length > 0 && (
            <ul className="divide-y divide-border-light">
              {conversations.map((conv) => {
                const isActive = conv.id === conversationId;
                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => navigate(`/messages/${conv.id}`)}
                      className={clsx(
                        "flex w-full items-start gap-3 px-3 py-3 transition-colors text-left",
                        isActive
                          ? "bg-brand-soft"
                          : "hover:bg-surface-hover",
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={clsx(
                              "text-[13px] font-semibold truncate",
                              isActive ? "text-brand-deep" : "text-text-main",
                            )}
                          >
                            {conv.otherUser.name}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-text-light shrink-0">
                              {formatListTime(
                                conv.lastMessage.createdAt as string,
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {conv.lastMessage ? (
                            <p className="truncate text-[12px] text-text-light flex-1">
                              {conv.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-[12px] text-text-light/60 italic">—</p>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Detail column */}
      <main
        className={clsx(
          "flex-1 min-w-0 flex flex-col bg-bg",
          conversationId ? "flex" : "hidden lg:flex",
        )}
      >
        {conversationId && activeConv ? (
          <ChatDetail conversation={activeConv} key={conversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-text-light" />
            </div>
            <p className="text-sm font-semibold text-text-main">
              {t.directChat.title}
            </p>
            <p className="text-xs text-text-light mt-1 max-w-[300px]">
              {t.directChat.noConversations}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatDetail({ conversation }: { conversation: Conversation }) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");

  const { data: messagesData } = useQuery({
    queryKey: ["direct-chat", "messages", conversation.id],
    queryFn: () => directChatApi.messages(conversation.id),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    directChatApi
      .markRead(conversation.id)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "unread-count"],
        });
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "conversations"],
        });
      })
      .catch(() => {});
  }, [conversation.id, messagesData, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      directChatApi.send(conversation.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["direct-chat", "messages", conversation.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["direct-chat", "conversations"],
      });
    },
    onError: () => toast.error(t.common.sendFailed),
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const content = input.trim();
    setInput("");
    sendMutation.mutate(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = messagesData?.data ?? [];

  // Group messages by day
  const messageGroups: { day: string; items: DirectMessage[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    const last = messageGroups[messageGroups.length - 1];
    if (last && last.day === day) {
      last.items.push(m);
    } else {
      messageGroups.push({ day, items: [m] });
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border-light bg-surface px-4 py-2.5 shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover lg:hidden"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {conversation.otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-main">
              {conversation.otherUser.name}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-1">
          {messageGroups.map((group) => (
            <div key={group.day} className="space-y-2.5">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-border-light" />
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wide rounded-full bg-surface-secondary border border-border-light">
                  {formatDayLabel(group.items[0]!.createdAt)}
                </span>
                <div className="flex-1 h-px bg-border-light" />
              </div>
              {group.items.map((msg) => {
                const isMine = msg.senderId === userId;
                return (
                  <div
                    key={msg.id}
                    className={clsx(
                      "flex",
                      isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={clsx(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        isMine
                          ? "rounded-br-md bg-brand-soft text-text-main"
                          : "rounded-bl-md bg-surface-secondary text-text-main",
                      )}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={clsx(
                          "mt-0.5 text-[10px]",
                          isMine ? "text-brand-deep/60" : "text-text-light",
                        )}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border-light bg-surface px-4 py-3 shrink-0">
        <div className="mx-auto max-w-3xl flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.directChat.inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border px-3.5 py-2.5 text-sm text-text-main placeholder-text-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ maxHeight: "100px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-all disabled:opacity-40 shrink-0 hover:bg-primary-dark"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
