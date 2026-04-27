import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { useT } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { crisisApi } from "../../lib/api/crisis";
import { notificationsApi } from "../../lib/api/notifications";
import { inactivityApi } from "../../lib/api/inactivity";
import { useThemeColors, spacing, radius } from "../../lib/theme";
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
      queryClient.invalidateQueries({ queryKey: ["crisis", "active"] }),
      queryClient.invalidateQueries({ queryKey: ["inactivity", "list"] }),
    ]);
    setRefreshing(false);
  };

  const { data: redData, isLoading: alertsLoading } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => crisisApi.getFeed("red"),
    refetchInterval: 30_000,
  });
  const redSignals = redData?.data ?? [];

  const { data: unreadNotifs } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: inactiveData, isLoading: inactiveLoading } = useQuery({
    queryKey: ["inactivity", "list"],
    queryFn: () => inactivityApi.list(),
    refetchInterval: 60_000,
  });
  const inactiveStudents = inactiveData?.data ?? [];

  const unreadCount = unreadNotifs?.count ?? 0;

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
  ];

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

        {/* Crisis alerts */}
        <Card elevated style={styles.crisisSection}>
          <View style={styles.crisisHeader}>
            <View style={styles.crisisHeaderLeft}>
              <View
                style={[styles.crisisIcon, { backgroundColor: `${c.danger}1A` }]}
              >
                <Ionicons name="alert-circle" size={14} color={c.danger} />
              </View>
              <Text variant="h3">{t.psychologist.redFeedFull}</Text>
              {redSignals.length > 0 && (
                <View style={[styles.alertCountBadge, { backgroundColor: c.danger }]}>
                  <Text style={styles.alertCountText}>
                    {redSignals.length}
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
          ) : redSignals.length > 0 ? (
            <View style={styles.alertsList}>
              {redSignals.slice(0, 3).map((signal) => (
                <Pressable
                  key={signal.id}
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
                      {signal.studentName}
                    </Text>
                    <Text variant="small" numberOfLines={1}>
                      {signal.summary}
                    </Text>
                  </View>
                  <View style={styles.alertTime}>
                    <Ionicons name="time-outline" size={11} color={c.textLight} />
                    <Text style={{ fontSize: 11, color: c.textLight }}>
                      {formatTimeAgo(signal.createdAt, t)}
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

        {/* Inactive students */}
        <Card elevated style={styles.inactiveSection}>
          <View style={styles.inactiveHeader}>
            <View style={styles.inactiveHeaderLeft}>
              <View
                style={[styles.inactiveIcon, { backgroundColor: `${c.warning}1A` }]}
              >
                <Ionicons name="moon-outline" size={14} color={c.warning} />
              </View>
              <Text variant="h3">{t.psychologist.inactiveStudentsTitle}</Text>
              {inactiveStudents.length > 0 && (
                <View style={[styles.alertCountBadge, { backgroundColor: c.warning }]}>
                  <Text style={styles.alertCountText}>
                    {inactiveStudents.length}
                  </Text>
                </View>
              )}
            </View>
            {inactiveStudents.length > 5 && (
              <Pressable
                onPress={() => router.push("/(tabs)/students")}
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
            )}
          </View>

          {inactiveLoading ? (
            <SkeletonList count={2} />
          ) : inactiveStudents.length > 0 ? (
            <View style={styles.alertsList}>
              {inactiveStudents.slice(0, 5).map((s) => (
                <Pressable
                  key={s.studentId}
                  onPress={() => {
                    hapticLight();
                    router.push(`/(screens)/students/${s.studentId}`);
                  }}
                  style={({ pressed }) => [
                    styles.alertItem,
                    {
                      backgroundColor: `${c.warning}08`,
                      borderColor: `${c.warning}1A`,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.alertItemIcon,
                      { backgroundColor: `${c.warning}1A` },
                    ]}
                  >
                    <Ionicons name="moon" size={16} color={c.warning} />
                  </View>
                  <View style={styles.alertItemBody}>
                    <Text
                      variant="body"
                      style={{ fontWeight: "700" }}
                      numberOfLines={1}
                    >
                      {s.studentName}
                    </Text>
                    <Text variant="small" numberOfLines={1}>
                      {s.grade != null
                        ? `${s.grade}${s.classLetter ?? ""}`
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.alertTime}>
                    <Text style={{ fontSize: 11, color: c.textLight }}>
                      {s.daysInactive != null
                        ? `${s.daysInactive} ${t.psychologist.inactiveDaysSuffix}`
                        : t.psychologist.inactiveNeverActive}
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
                {t.psychologist.inactiveStudentsEmpty}
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

  // Crisis
  crisisSection: {
    marginTop: 20,
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

  // Inactive students (reuses crisis section visual structure)
  inactiveSection: {
    marginTop: 16,
    padding: 0,
  },
  inactiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  inactiveHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inactiveIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
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

});
