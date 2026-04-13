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
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { moodApi } from "../../lib/api/mood";
import { contentApi } from "../../lib/api/content";
import { streaksApi } from "../../lib/api/streaks";
import { plantApi } from "../../lib/api/plant";
import { exercisesApi } from "../../lib/api/exercises";
import { appointmentsApi } from "../../lib/api/appointments";
import { achievementsApi } from "../../lib/api/achievements";
import { useDirectChatUnread } from "../../lib/hooks/useDirectChatUnread";
import { moodLevels } from "@tirek/shared";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": "😊",
  "avatar-2": "🤩",
  "avatar-3": "🦊",
  "avatar-4": "🐱",
  "avatar-5": "🚀",
  "avatar-6": "🌻",
};

const PLANT_EMOJI: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🌳",
  4: "🌸",
};

type QuickLink = {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  iconBg: string;
  iconColor: string;
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
      queryClient.invalidateQueries({ queryKey: ["mood", "today"] }),
      queryClient.invalidateQueries({ queryKey: ["quote"] }),
      queryClient.invalidateQueries({ queryKey: ["streak"] }),
      queryClient.invalidateQueries({ queryKey: ["plant"] }),
      queryClient.invalidateQueries({ queryKey: ["progress-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["appointments", "next"] }),
      queryClient.invalidateQueries({ queryKey: ["achievements-summary"] }),
    ]);
    setRefreshing(false);
  };

  const { data: todayMood } = useQuery({
    queryKey: ["mood", "today"],
    queryFn: moodApi.today,
  });

  const { data: quote } = useQuery({
    queryKey: ["quote"],
    queryFn: contentApi.quoteOfTheDay,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: streaksApi.get,
  });

  const { data: plant } = useQuery({
    queryKey: ["plant"],
    queryFn: plantApi.get,
  });

  const { data: stats } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: exercisesApi.stats,
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ["appointments", "next"],
    queryFn: appointmentsApi.next,
  });

  const { data: achievementsSummary } = useQuery({
    queryKey: ["achievements-summary"],
    queryFn: achievementsApi.getSummary,
  });

  const unreadCount = useDirectChatUnread();

  const quickLinks: QuickLink[] = [
    { route: "/(tabs)/chat", icon: "chatbubble", labelKey: "chat", iconBg: "rgba(15,118,110,0.1)", iconColor: "#0F766E" },
    { route: "/(screens)/tests", icon: "clipboard", labelKey: "tests", iconBg: "rgba(16,185,129,0.1)", iconColor: "#047857" },
    { route: "/(tabs)/exercises", icon: "leaf", labelKey: "exercises", iconBg: "rgba(14,165,233,0.1)", iconColor: "#0369A1" },
    { route: "/(screens)/journal", icon: "book", labelKey: "journal", iconBg: "rgba(245,158,11,0.1)", iconColor: "#92400E" },
    { route: "/(screens)/messages", icon: "mail", labelKey: "messages", iconBg: "rgba(34,197,94,0.1)", iconColor: "#15803D" },
    { route: "/(screens)/mood-calendar", icon: "calendar", labelKey: "moodCalendar", iconBg: "rgba(59,130,246,0.1)", iconColor: "#1D4ED8" },
    { route: "/(screens)/appointments", icon: "time", labelKey: "appointments", iconBg: "rgba(139,92,246,0.1)", iconColor: "#6D28D9" },
    { route: "/(screens)/achievements", icon: "trophy", labelKey: "achievements", iconBg: "rgba(234,179,8,0.1)", iconColor: "#92400E" },
  ];

  const quickLinkLabels: Record<string, string> = {
    chat: t.nav.chat,
    tests: t.nav.tests,
    exercises: t.nav.exercises,
    journal: t.nav.journal,
    messages: t.directChat.title,
    moodCalendar: t.mood.calendar,
    appointments: t.nav.appointments,
    achievements: t.achievements.title,
  };

  const avatarEmoji = user?.avatarId
    ? (AVATAR_MAP[user.avatarId] ?? "😊")
    : "😊";

  const plantProgress =
    plant && plant.stage < 4
      ? Math.max(
          Math.round(
            ((plant.growthPoints - [0, 50, 150, 300][plant.stage - 1]) /
              (plant.nextStageThreshold -
                [0, 50, 150, 300][plant.stage - 1])) *
              100,
          ),
          3,
        )
      : 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
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
          <View style={styles.greetingText}>
            <Text variant="h1">
              {t.dashboard.greeting},{" "}
              {user?.name?.split(" ")[0] ?? ""}!
            </Text>
            <Text variant="bodyLight" style={{ marginTop: 4 }}>
              {t.dashboard.howAreYou}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatarBtn, { backgroundColor: `${c.primary}14` }]}
          >
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </Pressable>
        </View>

        {/* Mood check-in widget */}
        <View style={{ marginTop: 20 }}>
          {todayMood ? (
            <Card style={styles.moodDoneCard}>
              <View style={styles.moodDoneIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={c.secondary}
                />
              </View>
              <Text variant="body" style={styles.moodDoneText}>
                {t.dashboard.moodDone}
              </Text>
              <Text style={styles.moodDoneEmoji}>
                {moodLevels.find((m) => m.value === todayMood.mood)
                  ?.emoji ?? "😐"}
              </Text>
            </Card>
          ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/mood")}
              style={({ pressed }) => [
                styles.moodCheckinCard,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View>
                <Text variant="h3">{t.dashboard.moodCheckin}</Text>
                <Text variant="small" style={{ marginTop: 2 }}>
                  {t.dashboard.howAreYou}
                </Text>
              </View>
              <View style={styles.moodEmojis}>
                {moodLevels.map((m) => (
                  <Text key={m.value} style={styles.moodEmoji}>
                    {m.emoji}
                  </Text>
                ))}
              </View>
            </Pressable>
          )}
        </View>

        {/* Streak widget */}
        {streak && streak.currentStreak > 0 && (
          <Card style={styles.widgetCard}>
            <View style={styles.widgetIcon}>
              <Ionicons name="flame" size={26} color="#F97316" />
            </View>
            <View style={styles.widgetBody}>
              <View style={styles.streakRow}>
                <Text style={styles.streakNum}>
                  {streak.currentStreak}
                </Text>
                <Text style={styles.streakLabel}>
                  {t.dashboard.streak}
                </Text>
              </View>
              <View style={styles.streakRecordRow}>
                <Ionicons name="trophy" size={11} color={c.textLight} />
                <Text variant="small">
                  {t.dashboard.streakRecord}: {streak.longestStreak}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Plant widget */}
        {plant && (
          <Pressable
            onPress={() => router.push("/(screens)/plant")}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Card
              style={[
                styles.widgetCard,
                plant.isSleeping && { opacity: 0.7 },
              ]}
            >
              <View style={styles.plantIcon}>
                <Text style={{ fontSize: 24 }}>
                  {PLANT_EMOJI[plant.stage] ?? "🌸"}
                </Text>
              </View>
              <View style={styles.widgetBody}>
                <Text variant="body" style={{ fontWeight: "700" }}>
                  {plant.name ?? t.plant.unnamed}
                </Text>
                <View style={styles.progressBarOuter}>
                  <View
                    style={[
                      styles.progressBarInner,
                      { width: `${plantProgress}%` },
                    ]}
                  />
                </View>
                <Text variant="small">
                  {plant.isSleeping
                    ? `💤 ${t.plant.sleeping}`
                    : plant.stage >= 4
                      ? t.plant.maxStage
                      : `${t.plant.pointsToNext}: ${plant.pointsToNextStage}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Achievements widget */}
        {achievementsSummary && achievementsSummary.totalCount > 0 && (
          <Pressable
            onPress={() => router.push("/(screens)/achievements")}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Card style={styles.widgetCard}>
              <View style={styles.achieveIcon}>
                {achievementsSummary.recentAchievements.length > 0 ? (
                  <Text style={{ fontSize: 24 }}>
                    {
                      achievementsSummary.recentAchievements[0]
                        .achievement.emoji
                    }
                  </Text>
                ) : (
                  <Ionicons name="trophy" size={26} color="#EAB308" />
                )}
              </View>
              <View style={styles.widgetBody}>
                <Text style={styles.achieveCaption}>
                  {t.achievements.title}
                </Text>
                <View style={styles.streakRow}>
                  <Text style={styles.achieveNum}>
                    {achievementsSummary.earnedCount}
                  </Text>
                  <Text style={styles.achieveTotal}>
                    / {achievementsSummary.totalCount}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Next appointment widget */}
        {nextAppointment && (
          <Pressable
            onPress={() => router.push("/(screens)/appointments")}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Card style={styles.widgetCard}>
              <View style={styles.apptIcon}>
                <Ionicons name="calendar" size={26} color="#8B5CF6" />
              </View>
              <View style={styles.widgetBody}>
                <Text style={styles.apptCaption}>
                  {t.appointments.nextAppointment}
                </Text>
                <Text variant="body" style={{ fontWeight: "700" }}>
                  {nextAppointment.date} · {nextAppointment.startTime}–
                  {nextAppointment.endTime}
                </Text>
                <Text variant="small">
                  {nextAppointment.psychologistName}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Quote of the day */}
        {quote && (
          <Card style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <Ionicons name="sparkles" size={13} color={c.primaryDark} />
              <Text style={[styles.quoteCaption, { color: c.primaryDark }]}>
                {t.dashboard.quoteOfTheDay}
              </Text>
            </View>
            <Text style={[styles.quoteText, { color: c.text }]}>
              «
              {language === "kz" && quote.textKz
                ? quote.textKz
                : quote.textRu}
              »
            </Text>
            {quote.author && (
              <Text style={[styles.quoteAuthor, { color: c.textLight }]}>
                — {quote.author}
              </Text>
            )}
          </Card>
        )}

        {/* Progress stats */}
        {stats &&
          (stats.exercisesCompleted > 0 ||
            stats.testsCompleted > 0 ||
            stats.journalEntries > 0) && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionCaption, { color: c.textLight }]}>
                {t.dashboard.progress}
              </Text>
              <View style={styles.statsRow}>
                {[
                  {
                    icon: "leaf" as const,
                    value: stats.exercisesCompleted,
                    label: t.dashboard.exercisesDone,
                    iconBg: "rgba(15,118,110,0.1)",
                    iconColor: "#0F766E",
                  },
                  {
                    icon: "clipboard" as const,
                    value: stats.testsCompleted,
                    label: t.dashboard.testsPassed,
                    iconBg: "rgba(16,185,129,0.1)",
                    iconColor: "#047857",
                  },
                  {
                    icon: "book" as const,
                    value: stats.journalEntries,
                    label: t.dashboard.journalEntries,
                    iconBg: "rgba(245,158,11,0.1)",
                    iconColor: "#92400E",
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: c.surface,
                        borderColor: c.borderLight,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: item.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={item.iconColor}
                      />
                    </View>
                    <Text style={[styles.statValue, { color: c.text }]}>
                      {item.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: c.textLight }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Quick access grid */}
        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <Text style={[styles.sectionCaption, { color: c.textLight }]}>
            {t.dashboard.quickAccess}
          </Text>
          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.quickItem,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.borderLight,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: item.iconBg },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.iconColor}
                  />
                  {item.labelKey === "messages" && unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: c.danger }]}>
                      <Text style={styles.unreadText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.quickLabel, { color: c.text }]}>
                  {quickLinkLabels[item.labelKey]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: {
    flex: 1,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  avatarEmoji: {
    fontSize: 22,
  },

  // Mood done
  moodDoneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moodDoneIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(45,109,140,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodDoneText: {
    flex: 1,
    fontWeight: "700",
  },
  moodDoneEmoji: {
    fontSize: 28,
  },

  // Mood check-in
  moodCheckinCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(2),
  },
  moodEmojis: {
    flexDirection: "row",
    gap: 4,
  },
  moodEmoji: {
    fontSize: 22,
  },

  // Widget cards
  widgetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
  },
  widgetIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetBody: {
    flex: 1,
  },
  plantIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  achieveIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(234,179,8,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  apptIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Streak
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  streakNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#EA580C",
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EA580C",
  },
  streakRecordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  // Achievements
  achieveCaption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#A16207",
  },
  achieveNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#CA8A04",
  },
  achieveTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CA8A04",
  },

  // Appointment
  apptCaption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6D28D9",
  },

  // Plant progress
  progressBarOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(16,185,129,0.12)",
    marginTop: 6,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressBarInner: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },

  // Quote
  quoteCard: {
    marginTop: 20,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  quoteCaption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 10,
  },

  // Section caption
  sectionCaption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    ...shadow(1),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 13,
  },

  // Quick access
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickItem: {
    width: "48%",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 18,
    ...shadow(1),
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
