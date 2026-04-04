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
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          onClick={() => navigate("/messages")}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {conversation?.otherUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-main">
              {conversation?.otherUser?.name ?? t.directChat.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg: DirectMessage) => {
            const isMine = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isMine
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-white text-text-main shadow-sm border border-gray-100"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
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
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.directChat.inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-main placeholder-text-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
