import { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
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
import { Text } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { directChatApi } from "../../../lib/api/direct-chat";
import { useAuthStore } from "../../../lib/store/auth-store";
import { hapticLight } from "../../../lib/haptics";
import type { DirectMessage } from "@tirek/shared";

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
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

  // Mark as read
  useEffect(() => {
    if (conversationId) {
      directChatApi.markRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["direct-chat", "unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
      });
    }
  }, [conversationId, messagesData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => directChatApi.send(conversationId!, content),
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

  function renderMessage({ item: msg }: { item: DirectMessage }) {
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
              ? [styles.bubbleMine, { backgroundColor: c.primary }]
              : [
                  styles.bubbleOther,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                ],
          ]}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: isMine ? "#FFF" : c.text,
            }}
          >
            {msg.content}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
              alignSelf: isMine ? "flex-end" : "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: isMine ? "rgba(255,255,255,0.6)" : c.textLight,
              }}
            >
              {formatMessageTime(msg.createdAt)}
            </Text>
            {isMine && (
              <Ionicons
                name={msg.readAt ? "checkmark-done" : "checkmark"}
                size={12}
                color={msg.readAt ? "#FFF" : "rgba(255,255,255,0.6)"}
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { backgroundColor: c.surface, borderBottomColor: c.borderLight }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={c.text} />
          </Pressable>
          <View style={[styles.headerAvatar, { backgroundColor: `${c.primary}1A` }]}>
            <Text style={{ fontSize: 13, fontFamily: "DMSans-SemiBold", color: c.primary }}>
              {conversation?.otherUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text variant="body" style={{ fontFamily: "DMSans-SemiBold", flex: 1 }} numberOfLines={1}>
            {conversation?.otherUser?.name ?? t.directChat.title}
          </Text>
        </View>

        {/* Messages */}
        {isLoading ? (
          <SkeletonList count={6} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(msg) => String(msg.id)}
            renderItem={renderMessage}
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
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.directChat.inputPlaceholder}
            placeholderTextColor={c.textLight}
            multiline
            maxLength={2000}
            style={[
              styles.textInput,
              {
                backgroundColor: c.bg,
                borderColor: c.borderLight,
                color: c.text,
              },
            ]}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: c.primary },
              (!input.trim() || sendMutation.isPending) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="send" size={16} color="#FFF" />
            <Text style={{ color: "#FFF", fontFamily: "DMSans-SemiBold", fontSize: 13 }}>
              {t.directChat.send}
            </Text>
          </Pressable>
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
    gap: 10,
    paddingHorizontal: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
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
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    fontFamily: "DMSans-Regular",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
});
