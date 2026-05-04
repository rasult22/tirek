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
import { Text, H3, Body, Pill, EmptyState } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { crisisApi } from "../../lib/api/crisis";
import { inactivityApi } from "../../lib/api/inactivity";
import { studentsApi } from "../../lib/api/students";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { formatRiskReason } from "@tirek/shared";
import { colors as ds, shadow as dsShadow } from "@tirek/shared/design-system";

function formatTimeAgo(dateStr: string, t: any) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t.psychologist.timeAgoLessThanMinute;
  if (minutes < 60) return `${minutes}${t.psychologist.timeAgoMinutes}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t.psychologist.timeAgoHours}`;
  return `${Math.floor(hours / 24)}${t.psychologist.timeAgoDays}`;
}

type HeroItem = {
  key: string;
  studentId: string;
  studentName: string;
  summary?: string;
  timestamp?: string;
};

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

  const { data: redData, isLoading: redLoading } = useQuery({
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

  const yellowAttentionLoading = yellowLoading || atRiskLoading;
  const totalAttentionCount = yellowSignals.length + atRiskStudents.length;

  // Build hero items for the yellow block (yellow signals + at-risk students).
  const yellowHeroItems: HeroItem[] = [
    ...yellowSignals.map((s) => ({
      key: `y-${s.id}`,
      studentId: s.studentId,
      studentName: s.studentName,
      summary: s.summary,
      timestamp: s.createdAt,
    })),
    ...atRiskStudents.map((s) => {
      const reasonText = formatRiskReason({
        reason: s.reason,
        t,
        language,
      });
      return {
        key: `risk-${s.studentId}`,
        studentId: s.studentId,
        studentName: s.studentName,
        summary: reasonText ?? undefined,
      } as HeroItem;
    }),
  ];

  const heroLoading = redLoading || (redSignals.length === 0 && yellowAttentionLoading);

  const showAllCalm =
    !redLoading &&
    !yellowAttentionLoading &&
    !inactiveLoading &&
    redSignals.length === 0 &&
    totalAttentionCount === 0 &&
    inactiveStudents.length === 0;

  // Decide which hero state to render.
  const heroMode: "red" | "yellow" | "calm" | "loading" =
    heroLoading
      ? "loading"
      : redSignals.length > 0
        ? "red"
        : totalAttentionCount > 0
          ? "yellow"
          : "calm";

  const goCrisisFeed = () => {
    hapticLight();
    router.push("/(tabs)/crisis");
  };

  const goStudent = (id: string) => {
    hapticLight();
    router.push(`/(screens)/students/${id}`);
  };

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
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="person-circle" size={40} color={c.primary} />
          </Pressable>
        </View>

        {/* HERO — single dominant block driven by state */}
        {heroMode === "loading" && (
          <View style={[styles.heroSurface, styles.heroNeutral]}>
            <SkeletonList count={3} />
          </View>
        )}

        {heroMode === "red" && (
          <HeroBlock
            tone="danger"
            icon="alert-circle"
            title={t.psychologist.dashboardRedHeroTitle}
            count={redSignals.length}
            items={redSignals.slice(0, 5).map((s) => ({
              key: s.id,
              studentId: s.studentId,
              studentName: s.studentName,
              summary: s.summary,
              timestamp: s.createdAt,
            }))}
            ctaLabel={t.psychologist.dashboardOpenCrisisFeedCta}
            onCtaPress={goCrisisFeed}
            onItemPress={(item) => {
              // For red signals the primary triage path is the crisis feed,
              // not the student profile.
              hapticLight();
              router.push("/(tabs)/crisis");
            }}
            formatTimestamp={(ts) => formatTimeAgo(ts, t)}
          />
        )}

        {heroMode === "yellow" && (
          <HeroBlock
            tone="warning"
            icon="eye-outline"
            title={t.psychologist.dashboardYellowHeroTitle}
            count={totalAttentionCount}
            items={yellowHeroItems.slice(0, 5)}
            ctaLabel={t.psychologist.dashboardOpenAttentionCta}
            onCtaPress={() => {
              hapticLight();
              router.push("/(tabs)/students");
            }}
            onItemPress={(item) => goStudent(item.studentId)}
            formatTimestamp={(ts) => formatTimeAgo(ts, t)}
          />
        )}

        {heroMode === "calm" && (
          <View style={styles.calmHero}>
            <EmptyState
              variant="all-calm"
              title={t.psychologist.dashboardAllCalmTitle}
              description={t.psychologist.dashboardAllCalmHint}
            />
          </View>
        )}

        {/* Inactive students — always secondary, plain rows (no cards). */}
        {(inactiveLoading || inactiveStudents.length > 0) && (
          <View style={styles.inactiveSection}>
            <View style={styles.inactiveSectionHeader}>
              <Text variant="caption">
                {t.psychologist.dashboardInactiveSectionLabel}
              </Text>
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
              <View>
                {inactiveStudents.slice(0, 5).map((s) => (
                  <Pressable
                    key={s.studentId}
                    onPress={() => goStudent(s.studentId)}
                    style={({ pressed }) => [
                      styles.inactiveRow,
                      { borderBottomColor: c.borderLight },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.inactiveRowMain}>
                      <Text
                        style={[styles.inactiveName, { color: c.text }]}
                        numberOfLines={1}
                      >
                        {s.studentName}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: c.textLight }}
                        numberOfLines={1}
                      >
                        {s.grade != null
                          ? `${s.grade}${s.classLetter ?? ""}`
                          : "—"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: c.textLight }}>
                      {s.daysInactive != null
                        ? `${s.daysInactive} ${t.psychologist.inactiveDaysSuffix}`
                        : t.psychologist.inactiveNeverActive}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* HeroBlock — the dominant state-driven block at the top of the screen */
/* ------------------------------------------------------------------ */

interface HeroBlockProps {
  tone: "danger" | "warning";
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  items: HeroItem[];
  ctaLabel: string;
  onCtaPress: () => void;
  onItemPress: (item: HeroItem) => void;
  formatTimestamp: (ts: string) => string;
}

function HeroBlock({
  tone,
  icon,
  title,
  count,
  items,
  ctaLabel,
  onCtaPress,
  onItemPress,
  formatTimestamp,
}: HeroBlockProps) {
  const c = useThemeColors();
  const accent = tone === "danger" ? c.danger : c.warning;
  const accentSoft = tone === "danger" ? ds.dangerSoft : ds.warningSoft;
  const heroBg =
    tone === "danger" ? ds.dangerSoft : ds.warningSoft;

  return (
    <View
      style={[
        styles.heroSurface,
        {
          backgroundColor: heroBg,
          borderColor: accent + "33",
        },
      ]}
    >
      {/* Header row: icon + title + count pill */}
      <View style={styles.heroHeader}>
        <View
          style={[
            styles.heroIconWrap,
            { backgroundColor: accent + "26" },
          ]}
        >
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text
          variant="h2"
          style={{ flex: 1, color: c.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {count > 0 && (
          <Pill
            variant={tone === "danger" ? "danger" : "warning"}
            label={String(count)}
          />
        )}
      </View>

      {/* Items — name 18/600, summary 12/textLight */}
      <View style={styles.heroList}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onItemPress(item)}
            style={({ pressed }) => [
              styles.heroRow,
              { borderBottomColor: accent + "1A" },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.heroRowMain}>
              <Text
                style={[styles.heroName, { color: c.text }]}
                numberOfLines={1}
              >
                {item.studentName}
              </Text>
              {item.summary ? (
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    color: c.textLight,
                    marginTop: 2,
                  }}
                  numberOfLines={2}
                >
                  {item.summary}
                </Text>
              ) : null}
            </View>
            {item.timestamp ? (
              <Text
                style={{
                  fontSize: 11,
                  color: c.textLight,
                  marginLeft: spacing.sm,
                }}
              >
                {formatTimestamp(item.timestamp)}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      {/* Single CTA */}
      <Pressable
        onPress={onCtaPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.heroCta,
          {
            backgroundColor: accent,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.heroCtaText}>{ctaLabel}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* styles                                                             */
/* ------------------------------------------------------------------ */

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

  // Hero surface
  heroSurface: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    minHeight: 240,
    shadowColor: dsShadow.md.color,
    shadowOffset: dsShadow.md.offset,
    shadowOpacity: dsShadow.md.opacity,
    shadowRadius: dsShadow.md.radius,
    elevation: dsShadow.md.elevation,
  },
  heroNeutral: {
    backgroundColor: ds.surface,
    borderColor: ds.hairline,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  heroList: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  heroRowMain: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  heroCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Calm hero
  calmHero: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: ds.surface,
    borderWidth: 1,
    borderColor: ds.hairline,
    paddingVertical: spacing.lg,
  },

  // Inactive secondary section
  inactiveSection: {
    marginTop: spacing["2xl"],
  },
  inactiveSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  inactiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  inactiveRowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  inactiveName: {
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
  },

  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
