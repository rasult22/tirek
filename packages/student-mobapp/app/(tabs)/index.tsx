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
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useRefresh } from "../../lib/hooks/useRefresh";
import { useAuthStore } from "../../lib/store/auth-store";
import { useDisplayName } from "../../lib/displayName";
import { moodApi } from "../../lib/api/mood";
import { contentApi } from "../../lib/api/content";
import { streaksApi } from "../../lib/api/streaks";
import { plantApi } from "../../lib/api/plant";
import { achievementsApi } from "../../lib/api/achievements";
import { OfficeHoursInfoBlock } from "../../components/OfficeHoursInfoBlock";
import { moodLevels } from "@tirek/shared";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { getRandomPlantName } from "../../lib/plant-names";

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
  const { push } = useRouter();
  const user = useAuthStore((s) => s.user);
  const displayName = useDisplayName(user?.name);
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mood", "today"] }),
      queryClient.invalidateQueries({ queryKey: ["quote"] }),
      queryClient.invalidateQueries({ queryKey: ["streak"] }),
      queryClient.invalidateQueries({ queryKey: ["plant"] }),
      queryClient.invalidateQueries({ queryKey: ["office-hours", "info-block"] }),
      queryClient.invalidateQueries({ queryKey: ["achievements-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["tests", "assigned"] }),
    ]);
  });

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

  const { data: achievementsSummary } = useQuery({
    queryKey: ["achievements-summary"],
    queryFn: achievementsApi.getSummary,
  });

  const quickLinks: QuickLink[] = [
    { route: "/(tabs)/exercises", icon: "leaf", labelKey: "exercises", iconBg: "rgba(14,165,233,0.1)", iconColor: "#0369A1" },
    { route: "/(screens)/journal", icon: "book", labelKey: "journal", iconBg: "rgba(245,158,11,0.1)", iconColor: "#92400E" },
    { route: "/(screens)/mood-history", icon: "calendar", labelKey: "moodHistory", iconBg: "rgba(59,130,246,0.1)", iconColor: "#1D4ED8" },
    { route: "/(screens)/achievements", icon: "trophy", labelKey: "achievements", iconBg: "rgba(234,179,8,0.1)", iconColor: "#92400E" },
    { route: "/(screens)/inspiration", icon: "sparkles", labelKey: "inspiration", iconBg: "rgba(168,85,247,0.1)", iconColor: "#7C3AED" },
  ];

  const quickLinkLabels: Record<string, string> = {
    exercises: t.nav.exercises,
    journal: t.nav.journal,
    moodHistory: t.mood.lastSevenDays,
    achievements: t.achievements.title,
    inspiration: t.inspiration.title,
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
            onRefresh={onRefresh}
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
              {displayName?.split(" ")[0] ?? ""}!
            </Text>
            <Text variant="bodyLight" style={styles.greetingSub}>
              {t.dashboard.howAreYou}
            </Text>
          </View>
          <Pressable
            onPress={() => push("/(tabs)/profile")}
            style={[styles.avatarBtn, { backgroundColor: `${c.primary}14` }]}
          >
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </Pressable>
        </View>

        {/* Mood check-in widget */}
        <View style={styles.moodSection}>
          {todayMood && (todayMood.daySlot || todayMood.eveningSlot) ? (
            <Pressable
              onPress={() => push("/(tabs)/mood")}
              style={({ pressed }) => [
                styles.moodDoneCard,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Card style={styles.moodDoneCard}>
                <View style={styles.moodDoneIcon}>
                  <Ionicons name="checkmark-circle" size={22} color={c.secondary} />
                </View>
                <View style={styles.moodSlotsRow}>
                  <View style={styles.moodSlotItem}>
                    <Text variant="small" style={styles.moodSlotLabel}>
                      {t.dashboard.moodDaySlot}
                    </Text>
                    <Text style={styles.moodDoneEmoji}>
                      {todayMood.daySlot
                        ? moodLevels.find((m) => m.value === todayMood.daySlot!.mood)?.emoji ?? "😐"
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.moodSlotItem}>
                    <Text variant="small" style={styles.moodSlotLabel}>
                      {t.dashboard.moodEveningSlot}
                    </Text>
                    <Text style={styles.moodDoneEmoji}>
                      {todayMood.eveningSlot
                        ? moodLevels.find((m) => m.value === todayMood.eveningSlot!.mood)?.emoji ?? "😐"
                        : "—"}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => push("/(tabs)/mood")}
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
                <Text variant="small" style={styles.moodCheckinSub}>
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
            onPress={() => push("/(screens)/plant")}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Card
              style={[
                styles.widgetCard,
                plant.isSleeping && { opacity: 0.7 },
              ]}
            >
              <View style={styles.plantIcon}>
                <Text style={styles.widgetEmoji}>
                  {PLANT_EMOJI[plant.stage] ?? "🌸"}
                </Text>
              </View>
              <View style={styles.widgetBody}>
                <Text variant="body" style={styles.boldText}>
                  {plant.name || getRandomPlantName(plant.createdAt ?? "default")}
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
                      : `${t.plant.pointsToNext}: ${plant.pointsToNextStage} ${t.plant.pointsUnit}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Achievements widget */}
        {achievementsSummary && achievementsSummary.totalCount > 0 && (
          <Pressable
            onPress={() => push("/(screens)/achievements")}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Card style={styles.widgetCard}>
              <View style={styles.achieveIcon}>
                {achievementsSummary.recentAchievements.length > 0 ? (
                  <Text style={styles.widgetEmoji}>
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

        {/* Office hours info block (psychologist availability) */}
        <OfficeHoursInfoBlock />

        {/* Quote of the day */}
        {quote && (
          <Pressable onPress={() => push("/(screens)/inspiration" as any)}>
            <Card style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Ionicons name="sparkles" size={13} color={c.primaryDark} />
                <Text style={[styles.quoteCaption, { color: c.primaryDark }]}>
                  {t.dashboard.quoteOfTheDay}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={14} color={c.textLight} />
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
          </Pressable>
        )}

        {/* Quick access grid */}
        <View style={styles.quickSection}>
          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => push(item.route as any)}
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
  moodSlotsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  moodSlotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moodSlotLabel: {
    fontWeight: "500",
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

  // Extracted inline styles
  greetingSub: {
    marginTop: 4,
  },
  moodSection: {
    marginTop: 20,
  },
  moodCheckinSub: {
    marginTop: 2,
  },
  widgetEmoji: {
    fontSize: 24,
  },
  boldText: {
    fontWeight: "700",
  },
  quickSection: {
    marginTop: 24,
    marginBottom: 16,
  },
});
