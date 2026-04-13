import { useState } from "react";
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { Text, Card, SeverityBadge } from "../ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import type {
  DiagnosticSession,
  CbtEntry,
  ThoughtDiaryData,
  UserAchievementItem,
} from "@tirek/shared";

type SubTab = "tests" | "cbt" | "achievements";

interface StudentAssessmentsTabProps {
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
}

export function StudentAssessmentsTab({
  testResults,
  cbtEntries,
  cbtLoading,
  achievements,
  achievementsLoading,
}: StudentAssessmentsTabProps) {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const [subTab, setSubTab] = useState<SubTab>("tests");

  const subTabs: { key: SubTab; label: string }[] = [
    { key: "tests", label: d.testsTab },
    { key: "cbt", label: d.cbtTab },
    { key: "achievements", label: d.achievementsTab },
  ];

  return (
    <View style={styles.container}>
      {/* Sub-tab bar */}
      <View
        style={[styles.tabBar, { backgroundColor: c.surfaceSecondary }]}
      >
        {subTabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setSubTab(tab.key)}
            style={[
              styles.tabItem,
              subTab === tab.key && [
                { backgroundColor: c.surface },
                shadow(1),
              ],
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: subTab === tab.key ? c.primary : c.textLight,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tests */}
      {subTab === "tests" && (
        <View>
          {testResults.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              text={t.common.noData}
              color={c.textLight}
            />
          ) : (
            <View style={styles.cardList}>
              {testResults.map((result) => (
                <Card key={result.id}>
                  <View style={styles.testRow}>
                    <View style={styles.testInfo}>
                      <Text variant="body" style={{ fontFamily: "DMSans-SemiBold" }}>
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
                          style={{ fontFamily: "DMSans-Bold", color: c.text }}
                        >
                          {result.totalScore}/{result.maxScore ?? "?"}
                        </Text>
                      )}
                      {result.severity && (
                        <SeverityBadge severity={result.severity} />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* CBT */}
      {subTab === "cbt" && (
        <View>
          {cbtLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={c.textLight} />
            </View>
          ) : (cbtEntries ?? []).length > 0 ? (
            <View style={styles.cardList}>
              {(cbtEntries ?? []).map((entry: CbtEntry) => {
                const data =
                  entry.type === "thought_diary"
                    ? (entry.data as ThoughtDiaryData)
                    : null;
                return (
                  <Card key={entry.id}>
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
                      <View style={styles.cbtDetails}>
                        <CbtField
                          label={t.cbt.situation}
                          value={data.situation}
                          color={c}
                        />
                        <CbtField
                          label={t.cbt.thought}
                          value={data.thought}
                          color={c}
                        />
                        <CbtField
                          label={t.cbt.emotion}
                          value={`${data.emotion}${data.emotionIntensity ? ` (${data.emotionIntensity}/10)` : ""}`}
                          color={c}
                        />
                        {data.distortion && (
                          <CbtField
                            label={t.cbt.distortion}
                            value={data.distortion}
                            color={c}
                          />
                        )}
                        {data.alternative && (
                          <CbtField
                            label={t.cbt.alternative}
                            value={data.alternative}
                            color={c}
                          />
                        )}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="bulb-outline"
              text={t.common.noData}
              color={c.textLight}
            />
          )}
        </View>
      )}

      {/* Achievements */}
      {subTab === "achievements" && (
        <View>
          {achievementsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={c.textLight} />
            </View>
          ) : achievements && achievements.achievements.length > 0 ? (
            <Card>
              <View style={styles.achHeader}>
                <Text variant="h3">{t.achievements.title}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "DMSans-Bold",
                    color: "#D97706",
                  }}
                >
                  {achievements.earnedCount}/{achievements.totalCount}
                </Text>
              </View>
              <View style={styles.achGrid}>
                {achievements.achievements.map((item) => {
                  const name =
                    language === "kz" && item.achievement.nameKz
                      ? item.achievement.nameKz
                      : item.achievement.nameRu;
                  return (
                    <View
                      key={item.achievement.slug}
                      style={[
                        styles.achCard,
                        item.earned
                          ? {
                              borderColor: "#FDE68A",
                              backgroundColor: "#FFFBEB",
                            }
                          : {
                              borderColor: c.borderLight,
                              backgroundColor: c.surfaceSecondary,
                              opacity: 0.5,
                            },
                      ]}
                    >
                      <Text style={styles.achEmoji}>
                        {item.achievement.emoji}
                      </Text>
                      <Text
                        style={[styles.achName, { color: c.text }]}
                        numberOfLines={2}
                      >
                        {name}
                      </Text>
                      {item.earned && item.earnedAt ? (
                        <Text style={styles.achDate}>
                          {new Date(item.earnedAt).toLocaleDateString()}
                        </Text>
                      ) : (
                        <Ionicons
                          name="lock-closed"
                          size={10}
                          color={c.textLight}
                          style={{ marginTop: 2 }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : (
            <EmptyState
              icon="trophy-outline"
              text={t.common.noData}
              color={c.textLight}
            />
          )}
        </View>
      )}
    </View>
  );
}

function EmptyState({
  icon,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={32} color={color} />
      <Text variant="bodyLight">{text}</Text>
    </View>
  );
}

function CbtField({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: { textLight: string; text: string };
}) {
  return (
    <Text variant="body">
      <Text
        variant="body"
        style={{ fontFamily: "DMSans-SemiBold", color: color.textLight }}
      >
        {label}:{" "}
      </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: radius.sm,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm - 2,
    alignItems: "center",
  },
  cardList: {
    gap: spacing.sm,
  },
  testRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  cbtHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  cbtDetails: {
    gap: 4,
  },
  centered: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: spacing.sm,
  },
  achHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  achGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  achCard: {
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    width: "30%",
  },
  achEmoji: {
    fontSize: 22,
  },
  achName: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "DMSans-SemiBold",
    lineHeight: 13,
  },
  achDate: {
    marginTop: 2,
    fontSize: 9,
    color: "#D97706",
  },
});
