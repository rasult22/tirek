import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  buildPrintProfile,
  renderPrintProfileHtml,
} from "@tirek/shared/format-print-profile";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { Text, Button, Card, SeverityBadge, H3, Body } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { StudentHeroCard } from "../../../components/student/StudentHeroCard";
import { MoodSparkline } from "../../../components/student/MoodSparkline";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { studentsApi } from "../../../lib/api/students";
import { schoolsApi } from "../../../lib/api/schools";
import { achievementsApi } from "../../../lib/api/achievements";
import { cbtApi } from "../../../lib/api/cbt";
import { directChatApi } from "../../../lib/api/direct-chat";
import { timelineApi } from "../../../lib/api/timeline";
import { useAuthStore } from "../../../lib/store/auth-store";
import type {
  TimelineEvent,
  TimelineEventType,
} from "../../../lib/api/timeline";
import {
  calculateMoodTrend,
  calculateEngagement,
} from "../../../lib/utils/mood-analytics";
import type { ThoughtDiaryData } from "@tirek/shared";

type Filter = "all" | TimelineEventType;

export default function StudentDetailScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmDetach, setConfirmDetach] = useState(false);
  const [printing, setPrinting] = useState(false);
  const psychologist = useAuthStore((s) => s.user);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: studentAchievements, isLoading: achievementsLoading } =
    useQuery({
      queryKey: ["achievements", id],
      queryFn: () => achievementsApi.getStudentAchievements(id!),
      enabled: !!id,
    });

  const { data: cbtEntries } = useQuery({
    queryKey: ["cbt", id],
    queryFn: () => cbtApi.getStudentEntries(id!),
    enabled: !!id,
  });

  const timelineType: TimelineEventType | undefined =
    filter === "all" ? undefined : filter;

  const {
    data: timeline,
    isLoading: timelineLoading,
  } = useQuery({
    queryKey: ["timeline", id, filter],
    queryFn: () =>
      timelineApi.getStudentTimeline(id!, { type: timelineType, limit: 50 }),
    enabled: !!id,
  });

  const detachMutation = useMutation({
    mutationFn: () => studentsApi.detach(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.back();
    },
  });

  const moodTrend = useMemo(
    () => calculateMoodTrend(data?.moodHistory ?? []),
    [data?.moodHistory],
  );

  const engagement = useMemo(
    () =>
      calculateEngagement(
        data?.moodHistory ?? [],
        data?.testResults ?? [],
        cbtEntries?.data,
      ),
    [data?.moodHistory, data?.testResults, cbtEntries?.data],
  );

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student", id] }),
      queryClient.invalidateQueries({ queryKey: ["achievements", id] }),
      queryClient.invalidateQueries({ queryKey: ["cbt", id] }),
      queryClient.invalidateQueries({ queryKey: ["timeline", id] }),
    ]);
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <SkeletonList count={4} />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  const { student, status, reason, moodHistory, testResults } = data;
  const latestMood =
    moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : undefined;
  const earnedAchievements = (studentAchievements?.achievements ?? []).filter(
    (a) => a.earned,
  );
  const recentEarned = earnedAchievements.slice(-3).reverse();
  const recentTests = testResults.slice(-3).reverse();

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: d.filterAll },
    { key: "test", label: d.filterTests },
    { key: "mood", label: d.filterMood },
    { key: "cbt", label: d.filterCbt },
    { key: "message", label: d.filterMessages },
    { key: "crisis", label: d.filterCrisis },
  ];

  async function handlePrintProfile() {
    if (!psychologist) return;
    setPrinting(true);
    try {
      let schoolName: string | null = null;
      if (psychologist.schoolId) {
        try {
          const school = await schoolsApi.get(psychologist.schoolId);
          schoolName = school.name;
        } catch {
          schoolName = null;
        }
      }
      const profile = buildPrintProfile({
        schoolName,
        psychologistName: psychologist.name,
        student: {
          name: student.name,
          grade: student.grade,
          classLetter: student.classLetter,
        },
        moodHistory,
        testResults,
        today: new Date(),
        lang: language,
      });
      const html = renderPrintProfileHtml(profile, language);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t.psychologist.printProfile,
          UTI: "com.adobe.pdf",
        });
      }
    } catch {
      Alert.alert(t.psychologist.printProfileFailed);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: student.name }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: c.bg }}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
        >
          {/* Action bar */}
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                title={t.psychologist.writeMessage}
                onPress={async () => {
                  try {
                    const conv = await directChatApi.createConversation(id!);
                    router.push(`/(screens)/messages/${conv.id}`);
                  } catch {
                    router.push("/(tabs)/messages");
                  }
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                title={t.psychologist.assignTest}
                onPress={() => router.push("/(tabs)/diagnostics" as any)}
              />
            </View>
          </View>

          {/* Hero */}
          <StudentHeroCard
            student={student}
            status={status}
            reason={reason}
            moodTrend={moodTrend}
            engagement={engagement}
            latestMood={latestMood}
          />

          {/* Overview: Mood sparkline */}
          <MoodSparkline
            data={moodTrend.data}
            average={moodTrend.average}
            latestEntry={latestMood}
          />

          {/* Overview: Recent tests */}
          <Card>
            <View style={styles.sectionHeader}>
              <H3>{d.recentTests}</H3>
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
                        <Body style={{ fontWeight: "700", color: c.text }}>
                          {result.totalScore}/{result.maxScore ?? "?"}
                        </Body>
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

          {/* Overview: Achievements compact */}
          <Card>
            <View style={styles.sectionHeader}>
              <H3>{t.achievements.title}</H3>
              {studentAchievements && (
                <Body
                  size="xs"
                  style={{
                    fontWeight: "700",
                    color: c.warning,
                  }}
                >
                  {studentAchievements.earnedCount}/
                  {studentAchievements.totalCount}
                </Body>
              )}
            </View>
            {achievementsLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={c.textLight} />
              </View>
            ) : recentEarned.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons
                  name="trophy-outline"
                  size={16}
                  color={c.textLight}
                />
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
                        borderColor: `${c.warning}33`,
                        backgroundColor: `${c.warning}14`,
                      },
                    ]}
                  >
                    <Text style={styles.achievementEmoji}>
                      {item.achievement.emoji}
                    </Text>
                    <Body style={styles.achievementName} numberOfLines={2}>
                      {language === "kz" && item.achievement.nameKz
                        ? item.achievement.nameKz
                        : item.achievement.nameRu}
                    </Body>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Timeline */}
          <View style={styles.timelineSection}>
            <H3>{d.timeline}</H3>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {filters.map((f) => {
                const active = f.key === filter;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? c.primary : c.surface,
                        borderColor: active ? c.primary : c.borderLight,
                      },
                    ]}
                  >
                    <Body
                      size="sm"
                      style={{
                        fontWeight: "600",
                        color: active ? "#fff" : c.text,
                      }}
                    >
                      {f.label}
                    </Body>
                  </Pressable>
                );
              })}
            </ScrollView>
            {timelineLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={c.textLight} />
              </View>
            ) : (timeline?.data.length ?? 0) === 0 ? (
              <Card>
                <View style={styles.emptyRow}>
                  <Ionicons name="time-outline" size={16} color={c.textLight} />
                  <Text variant="bodyLight">{d.timelineEmpty}</Text>
                </View>
              </Card>
            ) : (
              <View style={styles.listGap}>
                {(timeline?.data ?? []).map((event) => (
                  <TimelineRow key={event.id} event={event} />
                ))}
              </View>
            )}
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Body
              size="sm"
              style={{
                fontWeight: "600",
                color: c.textLight,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {d.dangerZone}
            </Body>
            <Button
              variant="secondary"
              title={t.psychologist.printProfile}
              onPress={handlePrintProfile}
              loading={printing}
              disabled={printing}
            />
            <Button
              variant="danger"
              title={t.psychologist.detachStudent}
              onPress={() => setConfirmDetach(true)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={confirmDetach}
        title={t.psychologist.detachConfirmTitle}
        description={t.psychologist.detachConfirmDescription}
        confirmLabel={t.psychologist.detachStudent}
        variant="danger"
        onConfirm={() => {
          setConfirmDetach(false);
          detachMutation.mutate();
        }}
        onCancel={() => setConfirmDetach(false)}
      />
    </>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;

  const date = new Date(event.occurredAt).toLocaleDateString();

  let icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap =
    "time-outline";
  let title = "";
  let subtitle: string | null = null;
  let accent = c.textLight;

  if (event.type === "test") {
    icon = "document-text-outline";
    title = `${d.eventTest}: ${event.payload.testName}`;
    subtitle = event.payload.severity ?? null;
  } else if (event.type === "mood") {
    icon = "happy-outline";
    title = `${d.eventMood}: ${event.payload.mood}/5`;
    subtitle = event.payload.note;
  } else if (event.type === "cbt") {
    icon = "bulb-outline";
    title = d.eventCbt;
    subtitle = event.payload.summary;
  } else if (event.type === "message") {
    icon = "chatbubble-outline";
    title =
      event.payload.direction === "from_student"
        ? d.eventMessageFromStudent
        : d.eventMessageFromPsychologist;
    subtitle = event.payload.preview;
  } else if (event.type === "crisis") {
    icon = "alert-circle-outline";
    title = d.eventCrisis;
    subtitle = event.payload.summary;
    accent = event.payload.severity === "high" ? c.danger : c.warning;
  }

  return (
    <View
      style={[
        styles.timelineRow,
        { backgroundColor: c.surface, borderColor: c.borderLight },
      ]}
    >
      <View
        style={[styles.timelineIcon, { backgroundColor: c.surfaceSecondary }]}
      >
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.timelineRowHeader}>
          <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
          <Text variant="caption">{date}</Text>
        </View>
        {subtitle ? (
          <Text variant="bodyLight" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    fontWeight: "600",
    lineHeight: 12,
  },
  timelineSection: {
    gap: spacing.sm,
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  dangerZone: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
