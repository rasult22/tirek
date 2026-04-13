import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { Text, Card, SeverityBadge } from "../ui";
import { useThemeColors, spacing } from "../../lib/theme";
import { MoodSparkline } from "./MoodSparkline";
import type {
  MoodEntry,
  DiagnosticSession,
  CbtEntry,
  ThoughtDiaryData,
  UserAchievementItem,
} from "@tirek/shared";
import type { MoodTrendResult } from "../../lib/utils/mood-analytics";

interface StudentOverviewTabProps {
  moodTrend: MoodTrendResult;
  moodHistory: MoodEntry[];
  testResults: (DiagnosticSession & {
    testSlug?: string;
    testName?: string;
  })[];
  cbtEntries?: CbtEntry[];
  cbtLoading: boolean;
  achievements?: {
    achievements: UserAchievementItem[];
    earnedCount: number;
    totalCount: number;
  };
  achievementsLoading: boolean;
  onSwitchToAssessments: () => void;
}

export function StudentOverviewTab({
  moodTrend,
  moodHistory,
  testResults,
  cbtEntries,
  cbtLoading,
  achievements,
  achievementsLoading,
  onSwitchToAssessments,
}: StudentOverviewTabProps) {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;

  const latestEntry =
    moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : undefined;
  const recentTests = testResults.slice(-3).reverse();
  const recentCbt = (cbtEntries ?? []).slice(-3).reverse();
  const earnedAchievements = (achievements?.achievements ?? []).filter(
    (a) => a.earned,
  );
  const recentEarned = earnedAchievements.slice(-3).reverse();

  return (
    <View style={styles.container}>
      {/* Sparkline */}
      <MoodSparkline
        data={moodTrend.data}
        average={moodTrend.average}
        latestEntry={latestEntry}
      />

      {/* Recent Tests */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="h3">{d.recentTests}</Text>
          {testResults.length > 3 && (
            <Pressable
              onPress={onSwitchToAssessments}
              style={styles.seeAllBtn}
            >
              <Text variant="small" style={{ color: c.primary }}>
                {d.seeAll}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={c.primary} />
            </Pressable>
          )}
        </View>
        {recentTests.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={c.textLight}
            />
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        ) : (
          <View style={styles.listGap}>
            {recentTests.map((result) => (
              <View
                key={result.id}
                style={[styles.testRow, { borderColor: c.borderLight }]}
              >
                <View style={styles.testInfo}>
                  <Text variant="body" numberOfLines={1}>
                    {result.testName ?? result.testSlug ?? result.testId}
                  </Text>
                  <Text variant="caption">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleDateString()
                      : "—"}
                  </Text>
                </View>
                <View style={styles.testRight}>
                  {result.totalScore != null && (
                    <Text
                      variant="body"
                      style={{
                        fontFamily: "DMSans-Bold",
                        color: c.text,
                      }}
                    >
                      {result.totalScore}/{result.maxScore ?? "?"}
                    </Text>
                  )}
                  {result.severity && (
                    <SeverityBadge severity={result.severity} />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Recent CBT */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="h3">{d.recentCbt}</Text>
          {(cbtEntries ?? []).length > 3 && (
            <Pressable
              onPress={onSwitchToAssessments}
              style={styles.seeAllBtn}
            >
              <Text variant="small" style={{ color: c.primary }}>
                {d.seeAll}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={c.primary} />
            </Pressable>
          )}
        </View>
        {cbtLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={c.textLight} />
          </View>
        ) : recentCbt.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="bulb-outline" size={16} color={c.textLight} />
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        ) : (
          <View style={styles.listGap}>
            {recentCbt.map((entry) => {
              const data =
                entry.type === "thought_diary"
                  ? (entry.data as ThoughtDiaryData)
                  : null;
              return (
                <View
                  key={entry.id}
                  style={[styles.cbtRow, { borderColor: c.borderLight }]}
                >
                  <View style={styles.cbtHeader}>
                    <View
                      style={[
                        styles.cbtBadge,
                        { backgroundColor: "#EDE9FE" },
                      ]}
                    >
                      <Text style={styles.cbtBadgeText}>
                        {t.cbt.thoughtDiary}
                      </Text>
                    </View>
                    <Text variant="caption">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {data && (
                    <Text variant="body" numberOfLines={1}>
                      {data.situation}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Achievements Summary */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="h3">{t.achievements.title}</Text>
          {achievements && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans-Bold",
                color: "#D97706",
              }}
            >
              {achievements.earnedCount}/{achievements.totalCount}
            </Text>
          )}
        </View>
        {achievementsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={c.textLight} />
          </View>
        ) : recentEarned.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="trophy-outline" size={16} color={c.textLight} />
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        ) : (
          <View style={styles.achievementsRow}>
            {recentEarned.map((item) => (
              <View
                key={item.achievement.slug}
                style={[
                  styles.achievementCard,
                  {
                    borderColor: "#FDE68A",
                    backgroundColor: "#FFFBEB",
                  },
                ]}
              >
                <Text style={styles.achievementEmoji}>
                  {item.achievement.emoji}
                </Text>
                <Text style={styles.achievementName} numberOfLines={2}>
                  {language === "kz" && item.achievement.nameKz
                    ? item.achievement.nameKz
                    : item.achievement.nameRu}
                </Text>
              </View>
            ))}
            {earnedAchievements.length > 3 && (
              <Pressable
                onPress={onSwitchToAssessments}
                style={[
                  styles.achievementCard,
                  {
                    borderColor: c.borderLight,
                    backgroundColor: c.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "DMSans-Bold",
                    color: c.textLight,
                  }}
                >
                  +{earnedAchievements.length - 3}
                </Text>
                <Text style={[styles.achievementName, { color: c.textLight }]}>
                  {d.seeAll}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
  },
  centered: {
    paddingVertical: 12,
    alignItems: "center",
  },
  listGap: {
    gap: 6,
  },
  testRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  testInfo: {
    flex: 1,
    minWidth: 0,
  },
  testRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  cbtRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  cbtHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  cbtBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cbtBadgeText: {
    fontSize: 10,
    fontFamily: "DMSans-Bold",
    color: "#7C3AED",
  },
  achievementsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  achievementCard: {
    alignItems: "center",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    minWidth: 64,
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementName: {
    marginTop: 2,
    textAlign: "center",
    fontSize: 9,
    fontFamily: "DMSans-SemiBold",
    lineHeight: 12,
  },
});
