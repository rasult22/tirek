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
import {
  Text,
  Button,
  Card,
  SeverityBadge,
  H3,
  Body,
  EmptyState,
  HorizontalScrollList,
  DayDivider,
} from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { StudentHeroCard } from "../../../components/student/StudentHeroCard";
import { MoodChart } from "../../../components/student/MoodChart";
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
import { calculateMoodTrend } from "../../../lib/utils/mood-analytics";
import type { Language } from "@tirek/shared/i18n";

type Filter = "all" | TimelineEventType;

/** Visual hierarchy: crisis > test > cbt > message > mood (muted). */
type Tone = "loud" | "normal" | "muted";

const EVENT_TONE: Record<TimelineEventType, Tone> = {
  crisis: "loud",
  test: "loud",
  cbt: "normal",
  message: "normal",
  mood: "muted",
};

const EVENT_ICON: Record<TimelineEventType, keyof typeof Ionicons.glyphMap> = {
  crisis: "alert-circle",
  test: "document-text",
  cbt: "bulb-outline",
  message: "chatbubble-outline",
  mood: "happy-outline",
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(
  iso: string,
  language: Language,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const today = todayKey();
  const yest = yesterdayKey();
  if (iso === today) return todayLabel;
  if (iso === yest) return yesterdayLabel;
  const d = new Date(iso);
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  return d.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

function formatTime(iso: string, language: Language): string {
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupTimelineByDay(events: TimelineEvent[]): {
  day: string;
  items: TimelineEvent[];
}[] {
  // Events come ordered desc by occurredAt from the API.
  const groups: { day: string; items: TimelineEvent[] }[] = [];
  for (const ev of events) {
    const day = dayKey(ev.occurredAt);
    const existing = groups[groups.length - 1];
    if (existing && existing.day === day) {
      existing.items.push(ev);
    } else {
      groups.push({ day, items: [ev] });
    }
  }
  return groups;
}

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

  const { data: timeline, isLoading: timelineLoading } = useQuery({
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

  const timelineGroups = useMemo(
    () => groupTimelineByDay(timeline?.data ?? []),
    [timeline?.data],
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
  const recentEarned = earnedAchievements.slice(-8).reverse();
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

          {/* Hero — fullname + class + last mood scale, ring only on attention/crisis */}
          <StudentHeroCard
            student={student}
            status={status}
            reason={reason}
            latestMood={latestMood}
          />

          {/* Mood chart — hero of the screen, last 14 days with axis labels */}
          <MoodChart
            data={moodTrend.data}
            average={moodTrend.average}
            latestEntry={latestMood}
            size="hero"
          />

          {/* Recent tests */}
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

          {/* Achievements — horizontal scroll row */}
          <View style={styles.achievementsBlock}>
            <View
              style={[
                styles.sectionHeader,
                { paddingHorizontal: spacing.lg, marginBottom: 0 },
              ]}
            >
              <H3>{t.achievements.title}</H3>
              {studentAchievements && (
                <Body
                  size="xs"
                  style={{ fontWeight: "700", color: c.warning }}
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
              <View style={{ paddingHorizontal: spacing.lg }}>
                <View style={styles.emptyRow}>
                  <Ionicons
                    name="trophy-outline"
                    size={16}
                    color={c.textLight}
                  />
                  <Text variant="bodyLight">{t.common.noData}</Text>
                </View>
              </View>
            ) : (
              <HorizontalScrollList padX="lg" gap="sm">
                {recentEarned.map((item) => {
                  const earnedDate = item.earnedAt
                    ? new Date(item.earnedAt).toLocaleDateString(
                        language === "kz" ? "kk-KZ" : "ru-RU",
                        { day: "numeric", month: "short" },
                      )
                    : null;
                  return (
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
                      {earnedDate && (
                        <Body
                          size="xs"
                          style={[
                            styles.achievementDate,
                            { color: c.textLight },
                          ]}
                        >
                          {earnedDate}
                        </Body>
                      )}
                    </View>
                  );
                })}
              </HorizontalScrollList>
            )}
          </View>

          {/* Timeline — chronological with day dividers */}
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
            ) : timelineGroups.length === 0 ? (
              <EmptyState
                variant="no-data"
                icon="time-outline"
                title={d.timelineEmpty}
              />
            ) : (
              <View>
                {timelineGroups.map((group, gi) => (
                  <View key={group.day}>
                    <DayDivider
                      label={formatDayLabel(
                        group.day,
                        language,
                        d.today,
                        d.yesterday,
                      )}
                      marginY={gi === 0 ? "sm" : "lg"}
                    />
                    <View style={styles.timelineGroup}>
                      {group.items.map((event) => (
                        <TimelineRow
                          key={event.id}
                          event={event}
                          language={language}
                        />
                      ))}
                    </View>
                  </View>
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

function TimelineRow({
  event,
  language,
}: {
  event: TimelineEvent;
  language: Language;
}) {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;

  const time = formatTime(event.occurredAt, language);
  const tone = EVENT_TONE[event.type];
  const icon = EVENT_ICON[event.type];

  let title = "";
  let subtitle: string | null = null;
  let accent = c.textLight;

  if (event.type === "test") {
    title = `${d.eventTest}: ${event.payload.testName}`;
    subtitle = event.payload.severity ?? null;
    accent = c.primary;
  } else if (event.type === "mood") {
    title = `${d.eventMood}: ${event.payload.mood}/5`;
    subtitle = event.payload.note;
    accent = c.textLight;
  } else if (event.type === "cbt") {
    title = d.eventCbt;
    subtitle = event.payload.summary;
    accent = c.primary;
  } else if (event.type === "message") {
    title =
      event.payload.direction === "from_student"
        ? d.eventMessageFromStudent
        : d.eventMessageFromPsychologist;
    subtitle = event.payload.preview;
    accent = c.text;
  } else if (event.type === "crisis") {
    title = d.eventCrisis;
    subtitle = event.payload.summary;
    accent = event.payload.severity === "high" ? c.danger : c.warning;
  }

  // Visual hierarchy by tone:
  // - loud:    surface bg, full-weight title, accent icon w/ tinted bg
  // - normal:  surface bg, normal title, neutral icon
  // - muted:   no background, light title, faint icon
  const bg =
    tone === "loud"
      ? c.surface
      : tone === "normal"
        ? c.surface
        : "transparent";
  const titleVariant: "body" | "bodyLight" =
    tone === "muted" ? "bodyLight" : "body";
  const titleWeight: "700" | "600" | "400" =
    tone === "loud" ? "700" : tone === "normal" ? "600" : "400";
  const iconBg =
    tone === "loud"
      ? `${accent}1F`
      : tone === "normal"
        ? c.surfaceSecondary
        : "transparent";
  const borderWidth = tone === "muted" ? 0 : 1;
  const paddingV = tone === "muted" ? 4 : 10;

  return (
    <View
      style={[
        styles.timelineRow,
        {
          backgroundColor: bg,
          borderColor: c.borderLight,
          borderWidth,
          paddingVertical: paddingV,
        },
      ]}
    >
      <View style={[styles.timelineIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.timelineRowHeader}>
          <Text
            variant={titleVariant}
            numberOfLines={1}
            style={[
              { flex: 1, fontWeight: titleWeight },
              tone === "loud" && { color: accent },
            ]}
          >
            {title}
          </Text>
          <Text variant="caption">{time}</Text>
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
  achievementsBlock: {
    // Negate parent horizontal padding so the scroll list is true edge-to-edge.
    marginHorizontal: -20,
    gap: spacing.sm,
  },
  achievementCard: {
    alignItems: "center",
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    width: 96,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
  },
  achievementDate: {
    marginTop: 2,
    fontSize: 9,
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
  timelineGroup: {
    gap: 6,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: 12,
    borderRadius: radius.md,
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
