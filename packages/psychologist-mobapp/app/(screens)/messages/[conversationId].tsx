import { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../../lib/hooks/useLanguage";
import { Text, Body, Input, Button, DayDivider } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { useThemeColors, spacing } from "../../../lib/theme";
import { colors as ds } from "@tirek/shared/design-system";
import { directChatApi } from "../../../lib/api/direct-chat";
import { useAuthStore } from "../../../lib/store/auth-store";
import { hapticLight } from "../../../lib/haptics";
import type { DirectMessage } from "@tirek/shared";

const TIME_GROUP_GAP_MS = 5 * 60 * 1000;

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(date: Date, todayLabel: string, yesterdayLabel: string) {
  const now = new Date();
  if (isSameDay(date, now)) return todayLabel;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return yesterdayLabel;
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

interface ChatItem {
  type: "day" | "time" | "message";
  dayLabel?: string;
  timestamp?: string;
  message?: DirectMessage;
  showStatus?: boolean;
  isFirstInGroup?: boolean;
}

function buildItems(
  messages: DirectMessage[],
  userId: string | undefined,
  todayLabel: string,
  yesterdayLabel: string,
): ChatItem[] {
  const items: ChatItem[] = [];
  let prevDate: Date | null = null;
  let prevTime = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const date = new Date(msg.createdAt);
    const t = date.getTime();
    const next = messages[i + 1];

    // Day divider
    if (!prevDate || !isSameDay(prevDate, date)) {
      items.push({
        type: "day",
        dayLabel: dayLabel(date, todayLabel, yesterdayLabel),
      });
    }

    // Time-separator on first-of-day OR after >5min gap
    const newGroup =
      !prevDate ||
      !isSameDay(prevDate, date) ||
      t - prevTime > TIME_GROUP_GAP_MS;

    if (newGroup) {
      items.push({ type: "time", timestamp: msg.createdAt });
    }

    const isMine = msg.senderId === userId;
    const nextIsMineSameGroup =
      !!next &&
      next.senderId === userId &&
      isSameDay(date, new Date(next.createdAt)) &&
      new Date(next.createdAt).getTime() - t <= TIME_GROUP_GAP_MS;

    items.push({
      type: "message",
      message: msg,
      showStatus: isMine && !nextIsMineSameGroup,
      isFirstInGroup: newGroup,
    });

    prevDate = date;
    prevTime = t;
  }
  return items;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList<ChatItem>>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data: messagesData, isLoading } = useQuery({
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
  const messages = messagesData?.data ?? [];
  const items = buildItems(
    messages,
    userId,
    t.directChat.today,
    t.directChat.yesterday,
  );

  useEffect(() => {
    if (conversationId) {
      directChatApi.markRead(conversationId).then(() => {
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "unread-count"],
        });
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "conversations"],
        });
      });
    }
  }, [conversationId, messagesData]);

  useEffect(() => {
    if (items.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [items.length]);

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

  function handleSend() {
    if (!input.trim() || !conversationId || sendMutation.isPending) return;
    const content = input.trim();
    setInput("");
    hapticLight();
    sendMutation.mutate(content);
  }

  function renderItem({ item }: { item: ChatItem }) {
    if (item.type === "day") {
      return <DayDivider label={item.dayLabel!} marginY="md" />;
    }
    if (item.type === "time") {
      return (
        <View style={styles.timeSeparator}>
          <Text style={[styles.timeSeparatorText, { color: c.textLight }]}>
            {formatMessageTime(item.timestamp!)}
          </Text>
        </View>
      );
    }
    const msg = item.message!;
    const isMine = msg.senderId === userId;
    return (
      <View
        style={[
          styles.bubbleRow,
          isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine
              ? [styles.bubbleMine, { backgroundColor: ds.brandSoft }]
              : [
                  styles.bubbleOther,
                  { backgroundColor: c.surfaceSecondary },
                ],
          ]}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: c.text,
            }}
          >
            {msg.content}
          </Text>
          {isMine && item.showStatus && (
            <View style={styles.statusRow}>
              <Ionicons
                name={msg.readAt ? "checkmark-done" : "checkmark"}
                size={12}
                color={msg.readAt ? c.primary : c.textLight}
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["top"]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View
            style={[
              styles.chatHeader,
              {
                backgroundColor: c.surface,
                borderBottomColor: c.borderLight,
              },
            ]}
          >
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </Pressable>
            <View
              style={[styles.headerAvatar, { backgroundColor: ds.brandSoft }]}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: c.primary }}
              >
                {conversation?.otherUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Body style={{ fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {conversation?.otherUser?.name ?? t.directChat.title}
            </Body>
          </View>

          {/* Messages */}
          {isLoading ? (
            <SkeletonList count={6} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={items}
              keyExtractor={(it, idx) =>
                it.type === "message"
                  ? `m-${it.message!.id}`
                  : it.type === "day"
                  ? `d-${idx}`
                  : `t-${idx}`
              }
              renderItem={renderItem}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
          )}

          {/* Input bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: c.surface,
                borderTopColor: c.borderLight,
                paddingBottom: keyboardOpen ? 10 : 10 + insets.bottom,
              },
            ]}
          >
            <Input
              value={input}
              onChangeText={setInput}
              placeholder={t.directChat.inputPlaceholder}
              multiline
              maxLength={2000}
              containerStyle={styles.inputContainer}
              style={styles.inputText}
            />
            <Button
              title={t.directChat.send}
              onPress={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              loading={sendMutation.isPending}
              variant="primary"
              size="sm"
              fullWidth={false}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 3,
  },
  timeSeparator: {
    alignItems: "center",
    paddingVertical: 6,
  },
  timeSeparatorText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 10,
  },
});
