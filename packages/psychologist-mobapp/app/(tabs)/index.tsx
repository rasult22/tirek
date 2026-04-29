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
import { Text, Card, H3, Body, Pill } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { crisisApi } from "../../lib/api/crisis";
import { inactivityApi } from "../../lib/api/inactivity";
import { studentsApi } from "../../lib/api/students";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { formatRiskReason } from "@tirek/shared";

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
  const { language } = useLanguage();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["crisis", "feed", "red"] }),
      queryClient.invalidateQueries({ queryKey: ["crisis", "feed", "yellow"] }),
      queryClient.invalidateQueries({ queryKey: ["students", "at-risk"] }),
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

  const { data: yellowData, isLoading: yellowLoading } = useQuery({
    queryKey: ["crisis", "feed", "yellow"],
    queryFn: () => crisisApi.getFeed("yellow"),
    refetchInterval: 60_000,
  });

  const { data: atRiskData, isLoading: atRiskLoading } = useQuery({
    queryKey: ["students", "at-risk"],
    queryFn: () => studentsApi.atRisk(),
    refetchInterval: 60_000,
  });

  const { data: inactiveData, isLoading: inactiveLoading } = useQuery({
    queryKey: ["inactivity", "list"],
    queryFn: () => inactivityApi.list(),
    refetchInterval: 60_000,
  });
  const inactiveStudentsAll = inactiveData?.data ?? [];

  const redStudentIds = new Set(redSignals.map((s) => s.studentId));
  const yellowSignals = (yellowData?.data ?? []).filter(
    (s) => !redStudentIds.has(s.studentId),
  );
  const yellowStudentIds = new Set(yellowSignals.map((s) => s.studentId));
  const atRiskStudents = (atRiskData?.data ?? []).filter(
    (s) =>
      !redStudentIds.has(s.studentId) && !yellowStudentIds.has(s.studentId),
  );
  const attentionStudentIds = new Set([
    ...yellowStudentIds,
    ...atRiskStudents.map((s) => s.studentId),
  ]);
  const inactiveStudents = inactiveStudentsAll.filter(
    (s) =>
      !redStudentIds.has(s.studentId) && !attentionStudentIds.has(s.studentId),
  );

  const attentionLoading = yellowLoading || atRiskLoading;
  const attentionEmpty =
    yellowSignals.length === 0 && atRiskStudents.length === 0;

  const showAllCalm =
    !alertsLoading &&
    !attentionLoading &&
    !inactiveLoading &&
    redSignals.length === 0 &&
    attentionEmpty &&
    inactiveStudents.length === 0;

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
            <H3>
              {t.dashboard.greeting},{" "}
              {user?.name?.split(" ")[0] ?? ""}!
            </H3>
            <Body size="sm" style={{ marginTop: 4, color: c.textLight }}>
              {t.psychologist.role}
            </Body>
          </View>
          <Pressable
            accessibilityLabel={t.profile.title}
            onPress={() => {
              hapticLight();
              router.push("/(screens)/profile");
            }}
            style={({ pressed }) => [
              styles.profileAvatar,
              { backgroundColor: `${c.primary}1F` },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: c.primaryDark }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
            </Text>
          </Pressable>
        </View>

        {showAllCalm ? (
          <Card variant="floating" style={styles.allCalmCard}>
            <View
              style={[
                styles.allCalmIcon,
                { backgroundColor: `${c.success}1A` },
              ]}
            >
              <Ionicons name="checkmark-circle" size={28} color={c.success} />
            </View>
            <Text variant="h3" style={styles.allCalmTitle}>
              {t.psychologist.dashboardAllCalmTitle}
            </Text>
            <Text variant="bodyLight" style={styles.allCalmHint}>
              {t.psychologist.dashboardAllCalmHint}
            </Text>
          </Card>
        ) : (
          <>
            {/* Crisis alerts — показываем только если идёт загрузка или есть сигналы */}
            {(alertsLoading || redSignals.length > 0) && (
              <Card variant="floating" style={styles.crisisSection}>
                <View style={styles.crisisHeader}>
                  <View style={styles.crisisHeaderLeft}>
                    <View
                      style={[
                        styles.crisisIcon,
                        { backgroundColor: `${c.danger}1A` },
                      ]}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={14}
                        color={c.danger}
                      />
                    </View>
                    <Text variant="h3">{t.psychologist.redFeedFull}</Text>
                    {redSignals.length > 0 && (
                      <Pill
                        variant="danger"
                        label={String(redSignals.length)}
                      />
                    )}
                  </View>
                  <Pressable
                    onPress={() => router.push("/(tabs)/crisis")}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                  >
                    <View style={styles.viewAllRow}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: c.primary,
                        }}
                      >
                        {t.psychologist.studentDetail.seeAll}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={c.primary}
                      />
                    </View>
                  </Pressable>
                </View>

                {alertsLoading ? (
                  <SkeletonList count={2} />
                ) : (
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
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color={c.danger}
                          />
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
                          <Ionicons
                            name="time-outline"
                            size={11}
                            color={c.textLight}
                          />
                          <Text style={{ fontSize: 11, color: c.textLight }}>
                            {formatTimeAgo(signal.createdAt, t)}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* Attention block — yellow signals + at-risk students */}
            {!attentionEmpty && (
              <Card variant="floating" style={styles.inactiveSection}>
                <View style={styles.inactiveHeader}>
                  <View style={styles.inactiveHeaderLeft}>
                    <View
                      style={[
                        styles.inactiveIcon,
                        { backgroundColor: `${c.warning}1A` },
                      ]}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={c.warning}
                      />
                    </View>
                    <Text variant="h3">{t.psychologist.needsAttention}</Text>
                    <Pill
                      variant="warning"
                      label={String(yellowSignals.length + atRiskStudents.length)}
                    />
                  </View>
                </View>

                <View style={styles.alertsList}>
                  {yellowSignals.slice(0, 5).map((signal) => (
                    <Pressable
                      key={signal.id}
                      onPress={() => {
                        hapticLight();
                        router.push(`/(screens)/students/${signal.studentId}`);
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
                        <Ionicons name="eye" size={16} color={c.warning} />
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
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={c.textLight}
                        />
                        <Text style={{ fontSize: 11, color: c.textLight }}>
                          {formatTimeAgo(signal.createdAt, t)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}

                  {atRiskStudents.slice(0, 5).map((s) => {
                    const reasonText = formatRiskReason({
                      reason: s.reason,
                      t,
                      language,
                    });
                    return (
                      <Pressable
                        key={`risk-${s.studentId}`}
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
                          <Ionicons name="eye" size={16} color={c.warning} />
                        </View>
                        <View style={styles.alertItemBody}>
                          <Text
                            variant="body"
                            style={{ fontWeight: "700" }}
                            numberOfLines={1}
                          >
                            {s.studentName}
                          </Text>
                          {reasonText && (
                            <Text variant="small" numberOfLines={1}>
                              {reasonText}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* Inactive students — показываем только если идёт загрузка или есть ученики */}
            {(inactiveLoading || inactiveStudents.length > 0) && (
              <Card variant="floating" style={styles.inactiveSection}>
                <View style={styles.inactiveHeader}>
                  <View style={styles.inactiveHeaderLeft}>
                    <View
                      style={[
                        styles.inactiveIcon,
                        { backgroundColor: `${c.warning}1A` },
                      ]}
                    >
                      <Ionicons
                        name="moon-outline"
                        size={14}
                        color={c.warning}
                      />
                    </View>
                    <Text variant="h3">
                      {t.psychologist.inactiveStudentsTitle}
                    </Text>
                    {inactiveStudents.length > 0 && (
                      <Pill
                        variant="warning"
                        label={String(inactiveStudents.length)}
                      />
                    )}
                  </View>
                  {inactiveStudents.length > 5 && (
                    <Pressable
                      onPress={() => router.push("/(tabs)/students")}
                      style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                      <View style={styles.viewAllRow}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: c.primary,
                          }}
                        >
                          {t.psychologist.studentDetail.seeAll}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={c.primary}
                        />
                      </View>
                    </Pressable>
                  )}
                </View>

                {inactiveLoading ? (
                  <SkeletonList count={2} />
                ) : (
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
                )}
              </Card>
            )}
          </>
        )}

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
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
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

  // All-calm empty state (shown when no red signals and no inactive students)
  allCalmCard: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  allCalmIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  allCalmTitle: {
    textAlign: "center",
  },
  allCalmHint: {
    textAlign: "center",
  },
});
