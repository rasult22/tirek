import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { analyticsApi } from "../../lib/api/analytics";
import { crisisApi } from "../../lib/api/crisis";
import { notificationsApi } from "../../lib/api/notifications";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

function formatTimeAgo(dateStr: string, t: any) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t.psychologist.timeAgoLessThanMinute;
  if (minutes < 60) return `${minutes}${t.psychologist.timeAgoMinutes}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t.psychologist.timeAgoHours}`;
  return `${Math.floor(hours / 24)}${t.psychologist.timeAgoDays}`;
}

export default function DashboardScreen() {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] }),
      queryClient.invalidateQueries({ queryKey: ["crisis", "active"] }),
    ]);
    setRefreshing(false);
  };

  const {
    data: stats,
    isLoading: statsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.overview,
  });

  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: crisisApi.getActive,
    refetchInterval: 30_000,
  });

  const { data: unreadNotifs } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  });

  const unreadCount = unreadNotifs?.count ?? 0;

  const statCards: {
    label: string;
    value: number;
    icon: IoniconsName;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      label: t.psychologist.totalStudents,
      value: stats?.totalStudents ?? 0,
      icon: "people",
      iconBg: `${c.primary}1A`,
      iconColor: c.primary,
    },
    {
      label: t.psychologist.activeToday,
      value: stats?.activeToday ?? 0,
      icon: "pulse",
      iconBg: `${c.success}1A`,
      iconColor: c.success,
    },
    {
      label: t.psychologist.pendingTests,
      value: stats?.pendingTests ?? 0,
      icon: "clipboard-outline",
      iconBg: `${c.warning}1A`,
      iconColor: c.warning,
    },
    {
      label: t.psychologist.crisisAlerts,
      value: stats?.crisisAlerts ?? 0,
      icon: "alert-circle",
      iconBg: `${c.danger}1A`,
      iconColor: c.danger,
    },
  ];

  const quickActions: {
    label: string;
    icon: IoniconsName;
    iconBg: string;
    iconColor: string;
    route?: string;
  }[] = [
    {
      label: t.psychologist.assignTest,
      icon: "clipboard-outline",
      iconBg: `${c.primary}14`,
      iconColor: c.primary,
      route: "/(screens)/diagnostics/assign",
    },
    {
      label: t.psychologist.generateCodes,
      icon: "key-outline",
      iconBg: `${c.warning}14`,
      iconColor: c.warning,
    },
    {
      label: t.psychologist.analytics,
      icon: "bar-chart-outline",
      iconBg: `${c.success}14`,
      iconColor: c.success,
      route: "/(screens)/analytics",
    },
  ];

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
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text variant="h1">
              {t.dashboard.greeting},{" "}
              {user?.name?.split(" ")[0] ?? ""}!
            </Text>
            <Text variant="bodyLight" style={{ marginTop: 4 }}>
              {t.psychologist.role}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/(screens)/notifications");
            }}
            style={({ pressed }) => [
              styles.avatarBtn,
              { backgroundColor: `${c.primary}14` },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="notifications-outline" size={22} color={c.primary} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: c.danger }]}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 99 ? "99+" : String(unreadCount)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Stat cards 2x2 */}
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: c.surface,
                  borderColor: c.borderLight,
                },
                shadow(1),
              ]}
            >
              <View
                style={[styles.statIcon, { backgroundColor: card.iconBg }]}
              >
                <Ionicons name={card.icon} size={16} color={card.iconColor} />
              </View>
              <Text variant="number" style={styles.statValue}>
                {statsLoading ? (
                  <ActivityIndicator size="small" color={c.textLight} />
                ) : (
                  card.value
                )}
              </Text>
              <Text variant="small" style={styles.statLabel}>
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Crisis alerts */}
        <Card elevated style={styles.crisisSection}>
          <View style={styles.crisisHeader}>
            <View style={styles.crisisHeaderLeft}>
              <View
                style={[styles.crisisIcon, { backgroundColor: `${c.danger}1A` }]}
              >
                <Ionicons name="alert-circle" size={14} color={c.danger} />
              </View>
              <Text variant="h3">{t.psychologist.crisisAlerts}</Text>
              {(activeAlerts?.data?.length ?? 0) > 0 && (
                <View style={[styles.alertCountBadge, { backgroundColor: c.danger }]}>
                  <Text style={styles.alertCountText}>
                    {activeAlerts!.data.length}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/crisis")}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <View style={styles.viewAllRow}>
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: c.primary }}
                >
                  {t.psychologist.studentDetail.seeAll}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={c.primary} />
              </View>
            </Pressable>
          </View>

          {alertsLoading ? (
            <SkeletonList count={2} />
          ) : activeAlerts && activeAlerts.data.length > 0 ? (
            <View style={styles.alertsList}>
              {activeAlerts.data.slice(0, 3).map((alert) => (
                <Pressable
                  key={alert.id}
                  onPress={() => router.push("/(tabs)/crisis")}
                  style={({ pressed }) => [
                    styles.alertItem,
                    {
                      backgroundColor: `${c.danger}08`,
                      borderColor: `${c.danger}1A`,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.alertItemIcon,
                      { backgroundColor: `${c.danger}1A` },
                    ]}
                  >
                    <Ionicons name="alert-circle" size={16} color={c.danger} />
                  </View>
                  <View style={styles.alertItemBody}>
                    <Text
                      variant="body"
                      style={{ fontWeight: "700" }}
                      numberOfLines={1}
                    >
                      {alert.studentName ?? t.psychologist.student}
                    </Text>
                    <Text variant="small" numberOfLines={1}>
                      {t.psychologist.crisisLevel} {alert.level}
                      {alert.studentGrade
                        ? ` · ${alert.studentGrade}${alert.studentClass ?? ""}`
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.alertTime}>
                    <Ionicons name="time-outline" size={11} color={c.textLight} />
                    <Text style={{ fontSize: 11, color: c.textLight }}>
                      {formatTimeAgo(alert.createdAt, t)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.noAlerts}>
              <View
                style={[
                  styles.noAlertsIcon,
                  { backgroundColor: `${c.success}1A` },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color={c.success} />
              </View>
              <Text variant="bodyLight">
                {t.psychologist.noActiveAlerts}
              </Text>
            </View>
          )}
        </Card>

        {/* Quick actions */}
        <Card elevated style={styles.quickSection}>
          <Text variant="h3" style={styles.quickTitle}>
            {t.psychologist.quickActions}
          </Text>
          <View style={styles.quickList}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  hapticLight();
                  if (action.route) router.push(action.route as any);
                }}
                style={({ pressed }) => [
                  styles.quickItem,
                  { backgroundColor: pressed ? c.surfaceHover : "transparent" },
                ]}
              >
                <View
                  style={[
                    styles.quickItemIcon,
                    { backgroundColor: action.iconBg },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={16}
                    color={action.iconColor}
                  />
                </View>
                <Text variant="body" style={{ flex: 1, fontWeight: "600" }}>
                  {action.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={`${c.textLight}80`}
                />
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Mood overview */}
        <Card elevated style={styles.moodSection}>
          <Text variant="h3" style={styles.moodTitle}>
            {t.psychologist.moodOverview}
          </Text>
          {stats?.averageMood != null ? (
            <View style={styles.moodContent}>
              <Text style={styles.moodEmoji}>
                {stats.averageMood >= 4
                  ? "\u{1F60A}"
                  : stats.averageMood >= 3
                    ? "\u{1F610}"
                    : stats.averageMood >= 2
                      ? "\u{1F61F}"
                      : "\u{1F622}"}
              </Text>
              <Text variant="number">{stats.averageMood.toFixed(1)}</Text>
              <Text variant="small" style={{ marginTop: 2 }}>
                {t.psychologist.averageMood}
              </Text>
            </View>
          ) : (
            <Text
              variant="bodyLight"
              style={{ textAlign: "center", paddingVertical: 16 }}
            >
              {t.common.noData}
            </Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Greeting
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Stat cards
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {
    lineHeight: 14,
  },

  // Crisis
  crisisSection: {
    marginTop: 16,
    padding: 0,
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  crisisHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  crisisIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  alertCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  alertsList: {
    padding: spacing.lg,
    gap: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  alertItemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  alertItemBody: {
    flex: 1,
    minWidth: 0,
  },
  alertTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  noAlerts: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  noAlertsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick actions
  quickSection: {
    marginTop: 16,
  },
  quickTitle: {
    marginBottom: 12,
  },
  quickList: {
    gap: 4,
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
  },
  quickItemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Mood overview
  moodSection: {
    marginTop: 16,
  },
  moodTitle: {
    marginBottom: 12,
  },
  moodContent: {
    alignItems: "center",
    paddingVertical: 8,
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
});
