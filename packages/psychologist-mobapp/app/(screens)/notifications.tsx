import {
  View,
  Pressable,
  SectionList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Badge } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { notificationsApi } from "../../lib/api/notifications";
import { hapticLight } from "../../lib/haptics";
import type { Notification } from "@tirek/shared";

const typeIcons: Record<string, { emoji: string; color: string }> = {
  crisis: { emoji: "\u{1F6A8}", color: "danger" },
  sos_alert: { emoji: "\u{1F198}", color: "danger" },
  concern_detected: { emoji: "\u26A0\uFE0F", color: "warning" },
  reminder: { emoji: "\u{1F514}", color: "warning" },
  assignment: { emoji: "\u{1F4CB}", color: "primary" },
  direct_message: { emoji: "\u{1F4AC}", color: "success" },
  appointment: { emoji: "\u{1F4C5}", color: "info" },
  achievement: { emoji: "\u{1F3C6}", color: "warning" },
  system: { emoji: "\u2139\uFE0F", color: "secondary" },
};

export default function NotificationsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getAll,
  });

  const { data: unread } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: notificationsApi.getUnreadCount,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "count"],
      });
    },
  });

  const unreadCount = unread?.count ?? 0;

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t.psychologist.notifications.justNow;
    if (minutes < 60) return `${minutes}${t.psychologist.timeAgoMinutes}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t.psychologist.timeAgoHours}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}${t.psychologist.timeAgoDays}`;
    return new Date(dateStr).toLocaleDateString();
  }

  function handleTap(n: Notification) {
    hapticLight();
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.type === "direct_message") {
      router.push("/(tabs)/messages");
    } else if (n.type === "sos_alert" || n.type === "concern_detected") {
      router.push("/(tabs)/crisis");
    }
  }

  const items = notifications?.data ?? [];

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  function dateGroup(dateStr: string): string {
    const d = new Date(dateStr).toDateString();
    if (d === today) return t.psychologist.notifications.today;
    if (d === yesterday) return t.psychologist.notifications.yesterday;
    return new Date(dateStr).toLocaleDateString();
  }

  // Build sections
  const sections: { title: string; data: Notification[] }[] = [];
  for (const item of items) {
    const label = dateGroup(item.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.title === label) {
      last.data.push(item);
    } else {
      sections.push({ title: label, data: [item] });
    }
  }

  if (isError) {
    return (
      <>
        <Stack.Screen
          options={{ title: t.psychologist.notifications.title }}
        />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t.psychologist.notifications.title,
          headerRight: () =>
            unreadCount > 0 ? (
              <Badge count={unreadCount} variant="danger" />
            ) : null,
        }}
      />

      {isLoading ? (
        <SkeletonList count={5} />
      ) : items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: c.bg }]}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={28}
              color={c.textLight}
            />
          </View>
          <Text
            variant="body"
            style={{ fontFamily: "DMSans-SemiBold" }}
          >
            {t.psychologist.notifications.noNotifications}
          </Text>
          <Text variant="bodyLight">
            {t.psychologist.notifications.noNotificationsDesc}
          </Text>
        </View>
      ) : (
        <SectionList
          style={{ flex: 1, backgroundColor: c.bg }}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={c.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: c.textLight }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item: n }) => {
            const icon = typeIcons[n.type] ?? typeIcons.system!;
            const iconBg = `${c[icon.color as keyof typeof c] ?? c.secondary}1A`;

            return (
              <Pressable
                onPress={() => handleTap(n)}
                style={({ pressed }) => [
                  styles.notifCard,
                  {
                    backgroundColor: !n.read
                      ? `${c.primary}08`
                      : c.surface,
                    borderColor: !n.read
                      ? `${c.primary}18`
                      : c.borderLight,
                  },
                  shadow(1),
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                  <Text style={{ fontSize: 18 }}>{icon.emoji}</Text>
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text
                      variant="body"
                      style={{
                        fontFamily: !n.read
                          ? "DMSans-Bold"
                          : "DMSans-SemiBold",
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text
                      variant="caption"
                      style={{ flexShrink: 0, marginLeft: 8 }}
                    >
                      {formatTimeAgo(n.createdAt)}
                    </Text>
                  </View>
                  <Text
                    variant="bodyLight"
                    numberOfLines={2}
                    style={{ marginTop: 2, lineHeight: 18 }}
                  >
                    {n.body}
                  </Text>
                </View>

                {!n.read && (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: c.primary },
                    ]}
                  />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "DMSans-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingVertical: 8,
    marginTop: 8,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    minWidth: 0,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
