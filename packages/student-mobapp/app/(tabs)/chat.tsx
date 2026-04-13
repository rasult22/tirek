import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { chatApi } from "../../lib/api/chat";
import type { ChatMessage } from "@tirek/shared";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

interface ToolCallEvent {
  id: string;
  toolName: string;
}

export default function ChatScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const c = useThemeColors();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    params.sessionId ?? null,
  );
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeSessionId],
    queryFn: () => chatApi.messages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const sessionRef = useRef<string | null>(activeSessionId);
  sessionRef.current = activeSessionId;

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleStream = useCallback(
    async (content: string) => {
      let sid = sessionRef.current;

      if (!sid) {
        const session = await chatApi.create("general");
        sid = session.id;
        sessionRef.current = sid;
        setActiveSessionId(sid);
        queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      }

      queryClient.setQueryData(
        ["chat", "messages", sid],
        (old: { data: ChatMessage[] } | undefined) => ({
          data: [
            ...(old?.data ?? []),
            {
              id: `temp-${Date.now()}`,
              sessionId: sid,
              role: "user" as const,
              content,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );

      setIsStreaming(true);
      setStreamingText("");
      setToolCalls([]);
      scrollToBottom();

      try {
        const res = await chatApi.streamMessage(sid, content);
        if (!res.body) throw new Error("No stream body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const payload = JSON.parse(line.slice(5).trim());
              if (payload.type === "token") {
                accumulated += payload.content;
                setStreamingText(accumulated);
                scrollToBottom();
              } else if (payload.type === "tool_call") {
                setToolCalls((prev) => [
                  ...prev,
                  { id: `tc-${Date.now()}`, toolName: payload.toolName },
                ]);
              } else if (
                payload.type === "done" ||
                payload.type === "error"
              ) {
                setStreamingText("");
                setIsStreaming(false);
                queryClient.invalidateQueries({
                  queryKey: ["chat", "messages", sid],
                });
              }
            } catch {}
          }
        }
      } catch {
        setStreamingText("");
        setIsStreaming(false);
        queryClient.invalidateQueries({
          queryKey: ["chat", "messages", sid],
        });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    hapticLight();
    const content = input.trim();
    setInput("");
    handleStream(content);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: c.borderLight,
              backgroundColor: c.surface,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push("/(screens)/chat-history")}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: c.surfaceSecondary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="time-outline" size={18} color={c.text} />
          </Pressable>
          <Text variant="h3" style={{ flex: 1 }}>
            {t.chat.title}
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {(!messages?.data || messages.data.length === 0) && !isStreaming && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>{"\u{1F44B}"}</Text>
              <Text style={[styles.emptyText, { color: c.textLight }]}>
                {t.chat.emptyState ?? "\u041D\u0430\u043F\u0438\u0448\u0438 \u043C\u043D\u0435 \u2014 \u044F \u0442\u0443\u0442, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C!"}
              </Text>
            </View>
          )}

          {messages?.data?.map((msg: ChatMessage) => (
            <View
              key={msg.id}
              style={[
                styles.bubbleRow,
                msg.role === "user"
                  ? styles.bubbleRowUser
                  : styles.bubbleRowAssistant,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === "user"
                    ? [styles.bubbleUser, { backgroundColor: c.primaryDark }]
                    : [styles.bubbleAssistant, { backgroundColor: c.surface }],
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: c.text },
                    msg.role === "user" && { color: "#FFFFFF" },
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {toolCalls.map((tc) => (
            <View key={tc.id} style={styles.toolCallRow}>
              <View style={styles.toolCallBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={c.success}
                />
                <Text style={[styles.toolCallText, { color: c.success }]}>
                  {t.chat.psychologistNotified}
                </Text>
              </View>
            </View>
          ))}

          {isStreaming && streamingText ? (
            <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: c.surface }]}>
                <Text style={[styles.bubbleText, { color: c.text }]}>{streamingText}</Text>
              </View>
            </View>
          ) : null}

          {isStreaming && !streamingText && (
            <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: c.surface }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: c.textLight }]} />
                  <View style={[styles.dot, { backgroundColor: c.textLight, opacity: 0.6 }]} />
                  <View style={[styles.dot, { backgroundColor: c.textLight, opacity: 0.3 }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: c.borderLight,
              backgroundColor: c.surface,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.chat.inputPlaceholder}
            placeholderTextColor={c.textLight}
            multiline
            style={[
              styles.textInput,
              {
                borderColor: c.border,
                color: c.text,
              },
            ]}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: c.primaryDark },
              (!input.trim() || isStreaming) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 16 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },

  bubbleRow: { marginBottom: 8 },
  bubbleRowUser: { alignItems: "flex-end" },
  bubbleRowAssistant: { alignItems: "flex-start" },

  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
    ...shadow(1),
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },

  toolCallRow: { alignItems: "center", marginVertical: 8 },
  toolCallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(22,121,74,0.08)",
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolCallText: { fontSize: 12, fontWeight: "500" },

  typingDots: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
