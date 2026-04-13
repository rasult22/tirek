import { useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { achievementsApi } from "../../lib/api/achievements";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { SkeletonList } from "../../components/Skeleton";
import type { AchievementCategory } from "@tirek/shared";

const CATEGORY_ORDER: AchievementCategory[] = [
  "first_steps",
  "streak",
  "mastery",
  "growth",
];

export default function AchievementsScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["achievements"],
    queryFn: achievementsApi.getAll,
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const progressPercent =
    data && data.totalCount > 0
      ? Math.round((data.earnedCount / data.totalCount) * 100)
      : 0;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: t.achievements.categories[cat],
    items: (data?.achievements ?? []).filter(
      (a) => a.achievement.category === cat,
    ),
  }));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === "kz" ? "kk-KZ" : "ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
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
        {/* Progress bar */}
        {data && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {t.achievements.progress}
              </Text>
              <Text style={styles.progressCount}>
                {data.earnedCount} / {data.totalCount}
              </Text>
            </View>
            <View style={styles.progressOuter}>
              <View
                style={[
                  styles.progressInner,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        )}

        {isLoading && <SkeletonList count={4} />}

        {/* Achievement groups */}
        {grouped.map(
          (group) =>
            group.items.length > 0 && (
              <View key={group.category} style={styles.groupSection}>
                <Text variant="caption" style={styles.groupLabel}>
                  {group.label}
                </Text>
                <View style={styles.grid}>
                  {group.items.map((item) => {
                    const name =
                      language === "kz" && item.achievement.nameKz
                        ? item.achievement.nameKz
                        : item.achievement.nameRu;
                    const desc =
                      language === "kz" && item.achievement.descriptionKz
                        ? item.achievement.descriptionKz
                        : item.achievement.descriptionRu;

                    return (
                      <View
                        key={item.achievement.slug}
                        style={[
                          styles.achieveCard,
                          {
                            backgroundColor: c.surface,
                            borderColor: c.borderLight,
                          },
                          !item.earned && styles.locked,
                        ]}
                      >
                        <Text style={styles.achieveEmoji}>
                          {item.achievement.emoji}
                        </Text>
                        <Text style={[styles.achieveName, { color: c.text }]}>{name}</Text>
                        {desc ? (
                          <Text style={[styles.achieveDesc, { color: c.textLight }]}>{desc}</Text>
                        ) : null}
                        {item.earned && item.earnedAt ? (
                          <Text style={styles.earnedDate}>
                            {formatDate(item.earnedAt)}
                          </Text>
                        ) : (
                          <View style={styles.lockedRow}>
                            <Ionicons
                              name="lock-closed"
                              size={10}
                              color={c.textLight}
                            />
                            <Text style={[styles.lockedText, { color: c.textLight }]}>
                              {t.achievements.locked}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ),
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
    paddingBottom: 32,
  },
  // Progress card
  progressCard: {
    backgroundColor: "rgba(234,179,8,0.1)",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  progressCount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B45309",
  },
  progressOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(217,168,47,0.25)",
    overflow: "hidden",
  },
  progressInner: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EAB308",
  },

  // Groups
  groupSection: {
    marginTop: 24,
  },
  groupLabel: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Achievement card
  achieveCard: {
    width: "48%",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  locked: {
    opacity: 0.5,
  },
  achieveEmoji: {
    fontSize: 32,
  },
  achieveName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },
  achieveDesc: {
    marginTop: 4,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  earnedDate: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "600",
    color: "#B45309",
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  lockedText: {
    fontSize: 10,
  },
});
