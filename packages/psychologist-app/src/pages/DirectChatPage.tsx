import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useAuthStore } from "../store/auth-store.js";
import { directChatApi } from "../api/direct-chat.js";
import type { DirectMessage } from "@tirek/shared";

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DirectChatPage() {
  const t = useT();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = useAuthStore((s) => s.user?.id);

  const [input, setInput] = useState("");

  const { data: messagesData } = useQuery({
    queryKey: ["direct-chat", "messages", conversationId],
    queryFn: () => directChatApi.messages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5_000,
  });

  const { data: convData } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
  });

  const conversation = convData?.data?.find((c) => c.id === conversationId);

  // Mark as read
  useEffect(() => {
    if (conversationId) {
      directChatApi.markRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["direct-chat", "unread-count"] });
      });
    }
  }, [conversationId, messagesData, queryClient]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      directChatApi.send(conversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["direct-chat", "messages", conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["direct-chat", "conversations"],
      });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !conversationId || sendMutation.isPending) return;
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

  return (
    <div className="flex flex-col -mx-4 -my-4" style={{ height: "calc(100dvh - 3rem - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-hover"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {conversation?.otherUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <h2 className="text-sm font-semibold text-text-main">
            {conversation?.otherUser?.name ?? t.directChat.title}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-2.5">
          {messages.map((msg: DirectMessage) => {
            const isMine = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-surface text-text-main shadow-sm border border-border-light"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      isMine ? "text-white/60" : "text-text-light"
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-2.5 shrink-0">
        <div className="flex items-end gap-2">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-all disabled:opacity-40 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
