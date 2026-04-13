import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../../lib/hooks/useLanguage";
import { useAuthStore } from "../../../lib/store/auth-store";
import { directChatApi } from "../../../lib/api/direct-chat";
import { Text } from "../../../components/ui";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import type { DirectMessage } from "@tirek/shared";

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationScreen() {
  const t = useT();
  const c = useThemeColors();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
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

  const conversation = convData?.data?.find((c_) => c_.id === conversationId);

  // Mark as read
  useEffect(() => {
    if (conversationId) {
      directChatApi.markRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["direct-chat", "unread-count"] });
      });
    }
  }, [conversationId, messagesData, queryClient]);

  const messages = messagesData?.data ?? [];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

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

  const renderMessage = ({ item: msg }: { item: DirectMessage }) => {
    const isMine = msg.senderId === userId;
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View
          style={[
            styles.bubble,
            isMine
              ? [styles.bubbleMine, { backgroundColor: c.primaryDark }]
              : [styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: c.borderLight }],
          ]}
        >
          <Text style={[styles.msgText, { color: c.text }, isMine && styles.msgTextMine]}>
            {msg.content}
          </Text>
          <Text
            style={[styles.msgTime, { color: c.textLight }, isMine && styles.msgTimeMine]}
          >
            {formatMessageTime(msg.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.borderLight }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: c.surfaceSecondary }, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </Pressable>
          <Text variant="body" style={[styles.headerTitle, { fontWeight: "700" }]} numberOfLines={1}>
            {conversation?.otherUser?.name ?? t.directChat.title}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_w, _h) => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={[styles.inputBar, { backgroundColor: c.surface, borderTopColor: c.borderLight }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.directChat.inputPlaceholder}
            placeholderTextColor={c.textLight}
            multiline
            style={[styles.textInput, { borderColor: c.borderLight, color: c.text }]}
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: c.primaryDark },
              (!input.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  msgRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  msgRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMine: {
    color: "#FFFFFF",
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  msgTimeMine: {
    color: "rgba(255,255,255,0.6)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
