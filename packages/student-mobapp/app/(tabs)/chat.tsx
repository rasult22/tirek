import { View, Pressable, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { chatApi } from "../../lib/api/chat";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";
import { hapticLight } from "../../lib/haptics";
import type { ChatSession } from "@tirek/shared";

const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function formatSessionDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return timeFormatter.format(d);
  }
  return dateFormatter.format(d);
}

function SessionItem({
  item,
  push,
  c,
  t,
}: {
  item: ChatSession;
  push: ReturnType<typeof useRouter>["push"];
  c: ReturnType<typeof useThemeColors>;
  t: any;
}) {
  return (
    <Pressable
      onPress={() =>
        push({
          pathname: "/(screens)/chat/[sessionId]",
          params: { sessionId: item.id },
        } as any)
      }
      style={({ pressed }) => [
        styles.sessionCard,
        { backgroundColor: c.surface },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.sessionIcon, { backgroundColor: `${c.primary}20` }]}>
        <Ionicons name="chatbubble" size={20} color={c.primary} />
      </View>
      <View style={styles.sessionInfo}>
        <Text numberOfLines={1} style={[styles.sessionPreview, { color: c.text }]}>
          {item.preview || t.chat.title}
        </Text>
        <View style={styles.sessionMeta}>
          <Ionicons name="time-outline" size={12} color={c.textLight} />
          <Text style={[styles.sessionDate, { color: c.textLight }]}>
            {formatSessionDate(item.lastMessageAt || item.startedAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textLight} />
    </Pressable>
  );
}

export default function ChatTabScreen() {
  const t = useT();
  const c = useThemeColors();
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: chatApi.sessions,
  });

  const { refreshing, onRefresh } = useRefresh(refetch);

  const createMutation = useMutation({
    mutationFn: () => chatApi.create("general"),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      push({
        pathname: "/(screens)/chat/[sessionId]",
        params: { sessionId: session.id },
      } as any);
    },
  });

  const handleNewChat = () => {
    hapticLight();
    createMutation.mutate();
  };

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  const sessionList = sessions?.data ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text variant="h2">{t.chat.title}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlashList
          data={sessionList}
          renderItem={({ item }) => (
            <SessionItem item={item} push={push} c={c} t={t} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={72}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
          ListHeaderComponent={
            <Pressable
              onPress={handleNewChat}
              disabled={createMutation.isPending}
              style={({ pressed }) => [
                styles.newChatBtn,
                { backgroundColor: c.primary },
                createMutation.isPending && { opacity: 0.6 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newChatText}>{t.chat.newChat}</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={40} color={c.borderLight} />
              <Text style={[styles.emptyText, { color: c.textLight }]}>
                {t.chat.emptyHistory}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    paddingHorizontal: spacing.xl,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
  },

  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    ...shadow(2),
  },
  newChatText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow(1),
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: { flex: 1 },
  sessionPreview: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  sessionDate: { fontSize: 12 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
});
