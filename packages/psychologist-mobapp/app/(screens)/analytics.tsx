import { useState, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text } from "../../components/ui";
import { Card } from "../../components/ui/Card";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { StatCard } from "../../components/analytics/StatCard";
import { StackedBar } from "../../components/charts/StackedBar";
import { LegendItem } from "../../components/charts/LegendItem";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { analyticsApi } from "../../lib/api/analytics";
import { exportApi } from "../../lib/api/export";
import { hapticLight } from "../../lib/haptics";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function AnalyticsScreen() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "analytics",
      "class",
      { grade: grade ?? undefined, classLetter: classLetter ?? undefined },
    ],
    queryFn: () =>
      analyticsApi.classReport({
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      }),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["analytics", "class"] });
    setRefreshing(false);
  }, [queryClient]);

  const handleExport = async () => {
    hapticLight();
    try {
      await exportApi.classCSV(grade ?? undefined, classLetter ?? undefined);
    } catch {
      // share cancelled or download failed — silently ignore
    }
  };

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: t.psychologist.analytics }} />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t.psychologist.analytics }} />
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        {/* Header — export button only, title is in Stack header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleExport}
            style={[
              styles.exportBtn,
              { borderColor: c.borderLight, backgroundColor: c.surface },
            ]}
          >
            <Ionicons name="download-outline" size={14} color={c.text} />
            <Text variant="small" style={{ fontFamily: "DMSans-SemiBold" }}>
              CSV
            </Text>
          </Pressable>
        </View>

        {/* Grade chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          <Pressable
            onPress={() => {
              hapticLight();
              setGrade(null);
            }}
            style={[
              styles.chip,
              grade === null
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: grade === null ? "#FFF" : c.textLight,
              }}
            >
              {t.psychologist.allGrades}
            </Text>
          </Pressable>
          {GRADES.map((g) => (
            <Pressable
              key={g}
              onPress={() => {
                hapticLight();
                setGrade(grade === g ? null : g);
              }}
              style={[
                styles.chip,
                grade === g
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: grade === g ? "#FFF" : c.textLight,
                }}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Class letter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScrollBottom}
        >
          <Pressable
            onPress={() => {
              hapticLight();
              setClassLetter(null);
            }}
            style={[
              styles.chip,
              classLetter === null
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: classLetter === null ? "#FFF" : c.textLight,
              }}
            >
              {t.psychologist.allClasses}
            </Text>
          </Pressable>
          {CLASS_LETTERS.map((l) => (
            <Pressable
              key={l}
              onPress={() => {
                hapticLight();
                setClassLetter(classLetter === l ? null : l);
              }}
              style={[
                styles.chip,
                classLetter === l
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: classLetter === l ? "#FFF" : c.textLight,
                }}
              >
                {l}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        {isLoading ? (
          <SkeletonList count={2} />
        ) : report ? (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={c.primary}
              />
            }
          >
            {/* Stat cards 2x2 */}
            <View style={styles.statsGrid}>
              <StatCard
                label={t.psychologist.totalStudents}
                value={report.totalStudents}
                icon="people-outline"
                iconBg={`${c.primary}1A`}
                iconColor={c.primary}
              />
              <StatCard
                label={t.psychologist.averageMood}
                value={
                  report.averageMood != null
                    ? report.averageMood.toFixed(1)
                    : "—"
                }
                icon="happy-outline"
                iconBg={`${c.success}1A`}
                iconColor={c.success}
              />
              <StatCard
                label={t.psychologist.testCompletion}
                value={`${Math.round(report.testCompletionRate * 100)}%`}
                icon="trending-up-outline"
                iconBg={`${c.warning}1A`}
                iconColor={c.warning}
              />
              <StatCard
                label={t.psychologist.atRisk}
                value={report.atRiskCount}
                icon="alert-circle-outline"
                iconBg={`${c.danger}1A`}
                iconColor={c.danger}
              />
            </View>

            {/* Mood distribution */}
            <Card elevated style={styles.chartCard}>
              <Text variant="h3" style={styles.chartTitle}>
                {t.psychologist.moodDistribution}
              </Text>
              <StackedBar
                segments={[
                  { value: report.moodDistribution.happy, color: c.success },
                  { value: report.moodDistribution.neutral, color: c.warning },
                  { value: report.moodDistribution.sad, color: c.danger },
                ]}
              />
              <View style={styles.legendRow}>
                <LegendItem
                  color={c.success}
                  label={t.psychologist.moodHappy}
                  value={report.moodDistribution.happy}
                />
                <LegendItem
                  color={c.warning}
                  label={t.psychologist.moodNeutral}
                  value={report.moodDistribution.neutral}
                />
                <LegendItem
                  color={c.danger}
                  label={t.psychologist.moodSad}
                  value={report.moodDistribution.sad}
                />
              </View>
            </Card>

            {/* Risk distribution */}
            <Card elevated style={styles.chartCard}>
              <Text variant="h3" style={styles.chartTitle}>
                {t.psychologist.riskDistribution}
              </Text>
              <StackedBar
                segments={[
                  { value: report.riskDistribution.normal, color: c.success },
                  {
                    value: report.riskDistribution.attention,
                    color: c.warning,
                  },
                  { value: report.riskDistribution.crisis, color: c.danger },
                ]}
              />
              <View style={styles.legendRow}>
                <LegendItem
                  color={c.success}
                  label={t.psychologist.statusNormal}
                  value={report.riskDistribution.normal}
                />
                <LegendItem
                  color={c.warning}
                  label={t.psychologist.statusAttention}
                  value={report.riskDistribution.attention}
                />
                <LegendItem
                  color={c.danger}
                  label={t.psychologist.statusCrisis}
                  value={report.riskDistribution.crisis}
                />
              </View>
            </Card>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: `${c.textLight}1A` },
              ]}
            >
              <Ionicons
                name="bar-chart-outline"
                size={32}
                color={c.textLight}
              />
            </View>
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  chipsScroll: {
    maxHeight: 36,
    marginBottom: 4,
  },
  chipsScrollBottom: {
    maxHeight: 36,
    marginBottom: 8,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chartCard: {
    gap: 12,
  },
  chartTitle: {
    marginBottom: 0,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
