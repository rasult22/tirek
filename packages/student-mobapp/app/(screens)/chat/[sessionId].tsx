import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../components/ui";
import { useT } from "../../../lib/hooks/useLanguage";
import { chatApi } from "../../../lib/api/chat";
import { directChatApi } from "../../../lib/api/direct-chat";
import type { ChatMessage } from "@tirek/shared";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { hapticLight } from "../../../lib/haptics";

interface ToolCallEvent {
  id: string;
  toolName: string;
}

interface RedirectCard {
  id: string;
  reason: string;
}

interface StreamingMessage {
  id: string;
  sessionId: string;
  role: "assistant";
  content: string;
  createdAt: string;
  _streaming: true;
}

type ListMessage = ChatMessage | StreamingMessage;

function MessageBubble({ item, c }: { item: ListMessage; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View
      style={[
        styles.bubbleRow,
        item.role === "user" ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.role === "user"
            ? [styles.bubbleUser, { backgroundColor: c.primaryDark }]
            : [styles.bubbleAssistant, { backgroundColor: c.surface }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: c.text },
            item.role === "user" && { color: "#FFFFFF" },
          ]}
        >
          {item.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatSessionScreen() {
  const t = useT();
  const router = useRouter();
  const { back } = router;
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const listRef = useRef<FlashList<ListMessage>>(null);
  const c = useThemeColors();

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [redirectCards, setRedirectCards] = useState<RedirectCard[]>([]);
  const [openingRedirect, setOpeningRedirect] = useState(false);

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", sessionId],
    queryFn: () => chatApi.messages(sessionId!),
    enabled: !!sessionId,
  });

  const { data: myPsychologist } = useQuery({
    queryKey: ["my-psychologist"],
    queryFn: directChatApi.myPsychologist,
    staleTime: 5 * 60 * 1000,
  });

  const openPsychologistChat = useCallback(async () => {
    if (!myPsychologist || openingRedirect) return;
    setOpeningRedirect(true);
    try {
      const conv = await directChatApi.createConversation(myPsychologist.id);
      router.push(`/(screens)/messages/${conv.id}` as never);
    } catch {
      // surface failure silently — kid can still tap again
    } finally {
      setOpeningRedirect(false);
    }
  }, [myPsychologist, openingRedirect, router]);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleStream = useCallback(
    async (content: string) => {
      if (!sessionId) return;

      queryClient.setQueryData(
        ["chat", "messages", sessionId],
        (old: { data: ChatMessage[] } | undefined) => ({
          data: [
            ...(old?.data ?? []),
            {
              id: `temp-${Date.now()}`,
              sessionId,
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
      setRedirectCards([]);
      scrollToBottom();

      try {
        const res = await chatApi.streamMessage(sessionId, content);
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
                if (
                  payload.toolName === "psychologist_redirect" &&
                  payload.result?.hint === "psychologist_redirect"
                ) {
                  setRedirectCards((prev) => [
                    ...prev,
                    { id: `rc-${Date.now()}`, reason: payload.result.reason ?? "" },
                  ]);
                }
              } else if (
                payload.type === "done" ||
                payload.type === "error"
              ) {
                setStreamingText("");
                setIsStreaming(false);
                queryClient.invalidateQueries({
                  queryKey: ["chat", "messages", sessionId],
                });
                queryClient.invalidateQueries({
                  queryKey: ["chat", "sessions"],
                });
              }
            } catch {}
          }
        }
      } catch {
        setStreamingText("");
        setIsStreaming(false);
        queryClient.invalidateQueries({
          queryKey: ["chat", "messages", sessionId],
        });
      }
    },
    [queryClient, sessionId],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const allMessages: ListMessage[] = [
    ...(messages?.data ?? []),
    ...(isStreaming && streamingText
      ? [
          {
            id: "streaming-msg",
            sessionId: sessionId ?? "",
            role: "assistant" as const,
            content: streamingText,
            createdAt: new Date().toISOString(),
            _streaming: true as const,
          },
        ]
      : []),
  ];

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
            onPress={() => back()}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: c.surfaceSecondary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={c.text} />
          </Pressable>
          <Text variant="h3" style={styles.headerTitle}>
            {t.chat.title}
          </Text>
        </View>

        {/* Messages */}
        <FlashList<ListMessage>
          ref={listRef}
          data={allMessages}
          renderItem={({ item }) => <MessageBubble item={item} c={c} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={60}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isStreaming ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{"\u{1F44B}"}</Text>
                <Text style={[styles.emptyText, { color: c.textLight }]}>
                  {t.chat.emptyState}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <>
              {toolCalls.length > 0 ? (
                <View style={styles.toolCallRow}>
                  <View style={styles.toolCallDot} />
                </View>
              ) : null}
              {redirectCards.map((card) => (
                <View key={card.id} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                  <Pressable
                    onPress={openPsychologistChat}
                    disabled={!myPsychologist || openingRedirect}
                    style={({ pressed }) => [
                      styles.redirectCard,
                      {
                        backgroundColor: `${c.primary}10`,
                        borderColor: `${c.primary}50`,
                      },
                      (!myPsychologist || openingRedirect) && { opacity: 0.5 },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.redirectHeader}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={c.primaryDark} />
                      <Text style={[styles.redirectMessage, { color: c.text }]}>
                        {myPsychologist
                          ? t.chat.redirectMessage.replace("{name}", myPsychologist.name)
                          : t.chat.redirectMessageDefault}
                      </Text>
                    </View>
                    {card.reason ? (
                      <Text style={[styles.redirectReason, { color: c.textLight }]}>
                        {card.reason}
                      </Text>
                    ) : null}
                    <View style={[styles.redirectCta, { backgroundColor: c.primaryDark }]}>
                      <Text style={styles.redirectCtaText}>{t.chat.redirectOpenChat}</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </View>
                  </Pressable>
                </View>
              ))}
              {isStreaming && !streamingText ? (
                <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                  <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: c.surface }]}>
                    <View style={styles.typingDots}>
                      <View style={[styles.dot, { backgroundColor: c.textLight }]} />
                      <View style={[styles.dot, { backgroundColor: c.textLight, opacity: 0.6 }]} />
                      <View style={[styles.dot, { backgroundColor: c.textLight, opacity: 0.3 }]} />
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          }
        />

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
  headerTitle: {
    flex: 1,
  },

  messagesContent: { paddingHorizontal: 16, paddingVertical: 16 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 40,
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
  toolCallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(52,211,153,0.6)",
  },

  redirectCard: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    borderWidth: 1,
  },
  redirectHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  redirectMessage: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  redirectReason: {
    marginTop: 4,
    marginLeft: 24,
    fontSize: 12,
  },
  redirectCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginLeft: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  redirectCtaText: {
    fontFamily: "DMSans-Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },

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
