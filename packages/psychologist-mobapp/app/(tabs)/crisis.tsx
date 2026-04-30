import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, H3, Body, Card, Pill } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { crisisApi } from "../../lib/api/crisis";
import { directChatApi } from "../../lib/api/direct-chat";
import { hapticLight } from "../../lib/haptics";
import type {
  CrisisFeed,
  CrisisSignal,
  CrisisSignalSeverity,
  CrisisSignalSource,
} from "@tirek/shared";

export default function CrisisScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeFeed, setActiveFeed] = useState<CrisisFeed>("red");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const {
    data: redData,
    isLoading: redLoading,
    isError: redError,
    refetch: refetchRed,
  } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => crisisApi.getFeed("red"),
    refetchInterval: 15_000,
  });

  const {
    data: yellowData,
    isLoading: yellowLoading,
    isError: yellowError,
  } = useQuery({
    queryKey: ["crisis", "feed", "yellow"],
    queryFn: () => crisisApi.getFeed("yellow"),
    refetchInterval: 30_000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: crisisApi.getHistory,
    enabled: historyOpen,
  });

  const { data: convData } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
  });

  async function openChatWithStudent(studentId: string) {
    const existing = convData?.data?.find((conv) => conv.studentId === studentId);
    if (existing) {
      router.push(`/(screens)/messages/${existing.id}`);
      return;
    }
    const created = await directChatApi.createConversation(studentId);
    queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
    router.push(`/(screens)/messages/${created.id}`);
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t.psychologist.timeAgoLessThanMinute;
    if (minutes < 60) return `${minutes}${t.psychologist.timeAgoMinutes}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t.psychologist.timeAgoHours}`;
    return `${Math.floor(hours / 24)}${t.psychologist.timeAgoDays}`;
  }

  function sourceLabel(source: CrisisSignalSource) {
    switch (source) {
      case "sos_urgent":
        return t.psychologist.signalSourceSosUrgent;
      case "ai_friend":
        return t.psychologist.signalSourceAiFriend;
      case "diagnostics":
        return t.psychologist.signalSourceDiagnostics;
    }
  }

  function severityLabel(severity: CrisisSignalSeverity) {
    switch (severity) {
      case "high":
        return t.psychologist.severityHigh;
      case "medium":
        return t.psychologist.severityMedium;
      case "low":
        return t.psychologist.severityLow;
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["crisis"] });
    setRefreshing(false);
  }

  const redSignals = redData?.data ?? [];
  const yellowSignals = yellowData?.data ?? [];
  const historySignals = history?.data ?? [];
  const isRed = activeFeed === "red";
  const currentSignals = isRed ? redSignals : yellowSignals;
  const currentLoading = isRed ? redLoading : yellowLoading;

  if (redError && yellowError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => refetchRed()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <H3>{t.psychologist.crisis}</H3>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.text}
          />
        }
      >
        {/* Feed tabs */}
        <View style={[styles.tabsRow, { backgroundColor: c.surfaceSecondary }]}>
          <Pressable
            onPress={() => {
              hapticLight();
              setActiveFeed("red");
            }}
            style={[
              styles.tab,
              isRed && [{ backgroundColor: c.surface }, shadow(1)],
            ]}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: isRed ? c.danger : `${c.danger}80` },
              ]}
            />
            <Body
              style={{
                fontWeight: "700",
                color: isRed ? c.text : c.textLight,
              }}
            >
              {t.psychologist.redFeed}
            </Body>
            {redSignals.length > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isRed ? c.danger : `${c.danger}1A`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: isRed ? "#FFF" : c.danger,
                  }}
                >
                  {String(redSignals.length)}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              hapticLight();
              setActiveFeed("yellow");
            }}
            style={[
              styles.tab,
              !isRed && [{ backgroundColor: c.surface }, shadow(1)],
            ]}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: !isRed ? c.warning : `${c.warning}80` },
              ]}
            />
            <Body
              style={{
                fontWeight: "700",
                color: !isRed ? c.text : c.textLight,
              }}
            >
              {t.psychologist.yellowFeed}
            </Body>
            {yellowSignals.length > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: !isRed ? c.warning : `${c.warning}1A`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: !isRed ? "#FFF" : c.warning,
                  }}
                >
                  {String(yellowSignals.length)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Current feed */}
        {currentLoading ? (
          <SkeletonList count={3} />
        ) : currentSignals.length > 0 ? (
          <View style={styles.cardsList}>
            {currentSignals.map((signal: CrisisSignal) => {
              const stripeColor = isRed ? c.danger : c.warning;
              return (
                <Card
                  key={signal.id}
                  style={{
                    padding: 0,
                    borderColor:
                      isRed && signal.severity === "high"
                        ? c.danger
                        : c.borderLight,
                    overflow: "hidden",
                  }}
                >
                  <View style={styles.cardRow}>
                    {/* Severity stripe */}
                    <View
                      style={[
                        styles.stripe,
                        { backgroundColor: stripeColor },
                      ]}
                    />

                    <View style={styles.cardBody}>
                      {/* Top row: name (16/600) + time (11/text-light) right */}
                      <View style={styles.topRow}>
                        <View style={styles.nameWrap}>
                          <Text
                            style={{
                              fontSize: 16,
                              lineHeight: 22,
                              fontFamily: "Inter_600SemiBold",
                              color: c.text,
                            }}
                            numberOfLines={1}
                          >
                            {signal.studentName}
                          </Text>
                          <View style={styles.metaRow}>
                            {signal.studentGrade !== null && (
                              <Text style={[styles.metaText, { color: c.textLight }]}>
                                {signal.studentGrade}
                                {signal.studentClassLetter ?? ""}
                              </Text>
                            )}
                            {signal.studentGrade !== null && (
                              <Text style={[styles.metaSep, { color: c.textLight }]}>·</Text>
                            )}
                            <Text style={[styles.metaText, { color: c.textLight }]}>
                              {sourceLabel(signal.source)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.timeText,
                            { color: c.textLight },
                          ]}
                        >
                          {formatTimeAgo(signal.createdAt)}
                        </Text>
                      </View>

                      {/* Summary 14/regular, 2 lines max */}
                      <Text
                        style={[styles.summaryText, { color: c.text }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {signal.summary}
                      </Text>

                      {/* Severity pill row */}
                      <View style={styles.pillRow}>
                        <Pill
                          label={severityLabel(signal.severity)}
                          variant={
                            signal.severity === "high"
                              ? "danger"
                              : signal.severity === "medium"
                                ? "warning"
                                : "brand"
                          }
                        />
                      </View>

                      {/* Quick actions */}
                      <View style={styles.actionsRow}>
                        <Pressable
                          onPress={() => {
                            hapticLight();
                            void openChatWithStudent(signal.studentId);
                          }}
                          style={[
                            styles.actionBtn,
                            { backgroundColor: c.surfaceSecondary },
                          ]}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={16}
                            color={c.success}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "500",
                              color: c.text,
                            }}
                          >
                            {t.psychologist.writeMessage}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            hapticLight();
                            router.push(
                              `/(screens)/crisis/resolve/${signal.id}` as any,
                            );
                          }}
                          style={[
                            styles.actionBtn,
                            { backgroundColor: c.surfaceSecondary },
                          ]}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={16}
                            color={c.textLight}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "500",
                              color: c.text,
                            }}
                          >
                            {t.psychologist.resolveSignal}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            hapticLight();
                            router.push(`/(screens)/students/${signal.studentId}`);
                          }}
                          style={[
                            styles.actionBtn,
                            { backgroundColor: c.surfaceSecondary },
                          ]}
                        >
                          <Ionicons
                            name="person-outline"
                            size={16}
                            color={c.primary}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "500",
                              color: c.text,
                            }}
                          >
                            {t.psychologist.profile}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View
              style={[styles.emptyIcon, { backgroundColor: `${c.success}1A` }]}
            >
              <Ionicons
                name={isRed ? "shield-checkmark-outline" : "alert-circle-outline"}
                size={24}
                color={c.success}
              />
            </View>
            <Body style={{ fontWeight: "700", color: c.text }}>
              {isRed
                ? t.psychologist.noRedFeedSignals
                : t.psychologist.noYellowFeedSignals}
            </Body>
            <Text variant="caption">{t.psychologist.allCalm}</Text>
          </Card>
        )}

        {/* History toggle */}
        <Pressable
          onPress={() => {
            hapticLight();
            setHistoryOpen(!historyOpen);
          }}
          style={styles.historyToggle}
        >
          <View style={styles.historyHeaderRow}>
            <View
              style={[
                styles.historyIcon,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons name="checkmark-circle" size={14} color={c.success} />
            </View>
            <Body style={{ fontWeight: "700", color: c.text }}>
              {t.psychologist.resolvedHistory}
            </Body>
          </View>
          <Ionicons
            name={historyOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={c.textLight}
          />
        </Pressable>

        {historyOpen && (
          <View style={{ gap: 8 }}>
            {historyLoading ? (
              <ActivityIndicator size="small" color={c.textLight} />
            ) : historySignals.length > 0 ? (
              historySignals.map((signal) => {
                const isExpanded = expandedHistoryId === signal.id;
                return (
                  <Pressable
                    key={signal.id}
                    onPress={() =>
                      setExpandedHistoryId(isExpanded ? null : signal.id)
                    }
                    style={[
                      styles.historyCard,
                      { backgroundColor: c.surface, borderColor: c.borderLight },
                    ]}
                  >
                    <View style={styles.historyHeaderRow}>
                      <View
                        style={[
                          styles.historyIcon,
                          { backgroundColor: `${c.success}14` },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={c.success}
                        />
                      </View>
                      <View style={styles.historyInfo}>
                        <Body
                          style={{ fontWeight: "700", color: c.text }}
                          numberOfLines={1}
                        >
                          {signal.studentName}
                        </Body>
                        {!isExpanded && (
                          <Text variant="caption" numberOfLines={1}>
                            {signal.summary}
                          </Text>
                        )}
                      </View>
                      <View style={styles.historyRight}>
                        <Pill
                          label={
                            signal.type === "acute_crisis"
                              ? t.psychologist.redFeed
                              : t.psychologist.yellowFeed
                          }
                          variant={
                            signal.type === "acute_crisis" ? "danger" : "warning"
                          }
                        />
                      </View>
                    </View>

                    {isExpanded && (
                      <View
                        style={[
                          styles.expandedDetails,
                          { borderTopColor: c.borderLight },
                        ]}
                      >
                        <View
                          style={[
                            styles.notesBlock,
                            { backgroundColor: c.surfaceSecondary },
                          ]}
                        >
                          <Text
                            style={{ fontSize: 13, color: c.text, lineHeight: 20 }}
                          >
                            {signal.summary}
                          </Text>
                        </View>
                        {signal.resolutionNotes ? (
                          <View
                            style={[
                              styles.notesBlock,
                              { backgroundColor: c.surfaceSecondary, marginTop: 6 },
                            ]}
                          >
                            <Text
                              style={{ fontSize: 13, color: c.text, lineHeight: 20 }}
                            >
                              {signal.resolutionNotes}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </Pressable>
                );
              })
            ) : (
              <Text
                variant="caption"
                style={{ textAlign: "center", paddingVertical: 12 }}
              >
                {t.common.noData}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  tabsRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  cardsList: { gap: 10 },
  cardRow: {
    flexDirection: "row",
    minHeight: 80,
  },
  stripe: {
    width: 4,
    alignSelf: "stretch",
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  metaSep: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  timeText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  pillRow: {
    flexDirection: "row",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCard: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  historyToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyCard: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  historyIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1, minWidth: 0 },
  historyRight: { alignItems: "flex-end" },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expandedDetails: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  notesBlock: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
