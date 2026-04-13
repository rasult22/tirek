import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Input } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { directChatApi } from "../../lib/api/direct-chat";
import { hapticLight } from "../../lib/haptics";
import type { Conversation } from "@tirek/shared";

function formatTime(dateStr: string, t: { directChat: { today: string; yesterday: string } }) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) return t.directChat.yesterday;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function MessagesScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: convData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
    refetchInterval: 30_000,
  });

  const conversations = convData?.data ?? [];

  const filtered = search
    ? conversations.filter((conv: Conversation) =>
        conv.otherUser.name.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
    setRefreshing(false);
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text variant="h1">{t.directChat.title}</Text>
      </View>

      <View style={styles.searchRow}>
        <Input
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
          placeholder={`${t.common.search}...`}
        />
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${c.primary}1A` }]}>
            <Ionicons name="chatbubbles-outline" size={32} color={c.primary} />
          </View>
          <Text variant="bodyLight">{t.directChat.noConversations}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
        >
          {filtered.map((conv: Conversation) => (
            <Pressable
              key={conv.id}
              onPress={() => {
                hapticLight();
                router.push(`/(screens)/messages/${conv.id}`);
              }}
              style={({ pressed }) => [
                styles.convCard,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
                shadow(1),
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: `${c.primary}1A` }]}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "DMSans-SemiBold",
                    color: c.primary,
                  }}
                >
                  {conv.otherUser.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text
                    variant="body"
                    style={{ fontFamily: "DMSans-SemiBold", flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {conv.otherUser.name}
                  </Text>
                  {conv.lastMessage && (
                    <Text variant="caption" style={{ flexShrink: 0 }}>
                      {formatTime(conv.lastMessage.createdAt as string, t)}
                    </Text>
                  )}
                </View>
                {conv.lastMessage && (
                  <Text variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
                    {conv.lastMessage.content}
                  </Text>
                )}
              </View>

              {conv.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "DMSans-Bold",
                      color: "#FFF",
                    }}
                  >
                    {conv.unreadCount}
                  </Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={`${c.textLight}60`} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
