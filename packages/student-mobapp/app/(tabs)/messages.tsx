import { View, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { directChatApi } from "../../lib/api/direct-chat";
import { ErrorState } from "../../components/ErrorState";
import { Text, Button } from "../../components/ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";
import type { Conversation } from "@tirek/shared";

const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return timeFormatter.format(d);
  if (isYesterday) return "\u0412\u0447\u0435\u0440\u0430";
  return shortDateFormatter.format(d);
}

export default function MessagesTabScreen() {
  const t = useT();
  const c = useThemeColors();
  const { push } = useRouter();
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
      push(`/(screens)/messages/${conv.id}`);
    },
  });

  const conversations = convData?.data ?? [];

  const { refreshing, onRefresh } = useRefresh(refetch);

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  const renderConversation = ({ item: conv }: { item: Conversation }) => (
    <Pressable
      onPress={() => push(`/(screens)/messages/${conv.id}`)}
      style={({ pressed }) => [styles.convCard, { backgroundColor: c.surface }, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: `${c.primary}20` }]}>
        <Ionicons name="person" size={22} color={c.primaryDark} />
      </View>
      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text variant="body" numberOfLines={1} style={[styles.convName, { fontWeight: "700" }]}>
            {conv.otherUser.name}
          </Text>
          {conv.lastMessage && (
            <Text style={[styles.convTime, { color: c.textLight }]}>
              {formatTime(conv.lastMessage.createdAt as string)}
            </Text>
          )}
        </View>
        {conv.lastMessage && (
          <Text numberOfLines={1} style={[styles.convLastMsg, { color: c.textLight }]}>
            {conv.lastMessage.content}
          </Text>
        )}
      </View>
      {conv.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: c.primaryDark }]}>
          <Text style={styles.unreadText}>{conv.unreadCount}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={c.textLight} />
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${c.primary}15` }]}>
        <Ionicons name="mail-outline" size={32} color={c.primary} />
      </View>
      <Text style={[styles.emptyText, { color: c.textLight }]}>{t.directChat.noConversations}</Text>
      {psychologist && (
        <Button
          title={t.directChat.writeToYourPsychologist}
          onPress={() => startMutation.mutate(psychologist.id)}
          disabled={startMutation.isPending}
          style={styles.startBtn}
        />
      )}
      {!psychologist && (
        <Text style={[styles.noPsychText, { color: c.textLight }]}>{t.directChat.noPsychologist}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text variant="h2">{t.directChat.title}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={conversations.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.sm,
  },
  listEmpty: {
    flexGrow: 1,
  },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(1),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  convContent: {
    flex: 1,
  },
  convHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  convTime: {
    fontSize: 11,
  },
  convLastMsg: {
    fontSize: 13,
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  startBtn: {
    marginTop: spacing.lg,
  },
  noPsychText: {
    fontSize: 12,
    marginTop: spacing.md,
  },
});
