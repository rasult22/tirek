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
import { Text, Input, H3, Body, Card } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors } from "../../lib/theme";
import { colors as ds } from "@tirek/shared/design-system";
import { directChatApi } from "../../lib/api/direct-chat";
import { useAuthStore } from "../../lib/store/auth-store";
import { hapticLight } from "../../lib/haptics";
import type { Conversation } from "@tirek/shared";

function formatTime(
  dateStr: string,
  t: { directChat: { today: string; yesterday: string } },
) {
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
  const userId = useAuthStore((s) => s.user?.id);

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
    await queryClient.invalidateQueries({
      queryKey: ["direct-chat", "conversations"],
    });
    setRefreshing(false);
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <H3>{t.directChat.title}</H3>
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
          <View style={[styles.emptyIcon, { backgroundColor: ds.brandSoft }]}>
            <Ionicons name="chatbubbles-outline" size={32} color={c.primary} />
          </View>
          <Body style={{ color: c.textLight }}>
            {t.directChat.noConversations}
          </Body>
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
          {filtered.map((conv: Conversation) => {
            // Unread indicator: only when last message is from the other side
            // (i.e. the student) and there's at least one unread.
            const lastIsFromStudent =
              !!conv.lastMessage && conv.lastMessage.senderId !== userId;
            const hasUnread = conv.unreadCount > 0 && lastIsFromStudent;

            return (
              <Pressable
                key={conv.id}
                onPress={() => {
                  hapticLight();
                  router.push(`/(screens)/messages/${conv.id}`);
                }}
                style={({ pressed }) => [
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Card style={styles.convCard}>
                  {/* Unread dot — single, brand color, left of avatar.
                      Reserve fixed width even when no dot to keep alignment. */}
                  <View style={styles.dotSlot}>
                    {hasUnread && (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: c.primary },
                        ]}
                      />
                    )}
                  </View>

                  <View
                    style={[styles.avatar, { backgroundColor: ds.brandSoft }]}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: c.primary,
                      }}
                    >
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.nameText,
                          {
                            color: c.text,
                            fontFamily: hasUnread
                              ? "Inter_700Bold"
                              : "Inter_600SemiBold",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {conv.otherUser.name}
                      </Text>
                      {conv.lastMessage && (
                        <Text
                          style={[
                            styles.timeText,
                            { color: c.textLight },
                          ]}
                        >
                          {formatTime(conv.lastMessage.createdAt as string, t)}
                        </Text>
                      )}
                    </View>
                    {conv.lastMessage && (
                      <Text
                        style={[
                          styles.lastMsgText,
                          {
                            color: hasUnread ? c.text : c.textLight,
                            fontFamily: hasUnread
                              ? "Inter_500Medium"
                              : "Inter_400Regular",
                          },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {conv.lastMessage.content}
                      </Text>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
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
    gap: 10,
    padding: 12,
  },
  dotSlot: {
    width: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  nameText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    flexShrink: 0,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_400Regular",
  },
  lastMsgText: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
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
