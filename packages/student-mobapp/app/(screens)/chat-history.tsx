import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { chatApi } from "../../lib/api/chat";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";

export default function ChatHistoryScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();

  const {
    data: sessions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: chatApi.sessions,
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const recentSessions = sessions?.data?.slice(0, 6) ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ title: t.chat.title }} />
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: t.chat.title }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* New chat button */}
        <Pressable
          onPress={() => router.replace("/(tabs)/chat")}
          style={({ pressed }) => [
            styles.newChatBtn,
            { backgroundColor: c.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newChatText}>{t.chat.newChat}</Text>
        </Pressable>

        {/* Sessions list */}
        {isLoading && <SkeletonList count={4} />}

        {recentSessions.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-outline"
              size={40}
              color={c.borderLight}
            />
            <Text style={[styles.emptyText, { color: c.textLight }]}>{t.common.noData}</Text>
          </View>
        )}

        {recentSessions.map((session) => (
          <Pressable
            key={session.id}
            onPress={() =>
              router.replace({
                pathname: "/(tabs)/chat",
                params: { sessionId: session.id },
              })
            }
            style={({ pressed }) => [
              styles.sessionCard,
              { backgroundColor: c.surface },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.sessionIcon}>
              <Text style={{ fontSize: 20 }}>{"\u{1F4AC}"}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text numberOfLines={1} style={[styles.sessionPreview, { color: c.text }]}>
                {session.preview || t.chat.title}
              </Text>
              <View style={styles.sessionMeta}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={c.textLight}
                />
                <Text style={[styles.sessionDate, { color: c.textLight }]}>
                  {formatDate(session.lastMessageAt || session.startedAt)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(2),
  },
  newChatText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: { fontSize: 14 },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: 12,
    ...shadow(1),
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(15,118,110,0.15)",
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
});
