import { useState, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Badge } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { crisisApi, type ResolveData } from "../../lib/api/crisis";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import type { SOSEvent, FlaggedMessage } from "@tirek/shared";

interface ResolveState {
  notes: string;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
}

export default function CrisisScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [resolveStates, setResolveStates] = useState<
    Record<string, ResolveState>
  >({});
  const [resolveSheetId, setResolveSheetId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const {
    data: active,
    isLoading: activeLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: crisisApi.getActive,
    refetchInterval: 15_000,
  });

  const { data: flagged } = useQuery({
    queryKey: ["crisis", "flagged"],
    queryFn: crisisApi.getFlaggedMessages,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: crisisApi.getHistory,
    enabled: historyOpen,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveData }) =>
      crisisApi.resolve(id, data),
    onSuccess: () => {
      setResolveSheetId(null);
      hapticSuccess();
      queryClient.invalidateQueries({ queryKey: ["crisis"] });
    },
  });

  function getState(id: string): ResolveState {
    return (
      resolveStates[id] ?? {
        notes: "",
        contactedStudent: false,
        contactedParent: false,
        documented: false,
      }
    );
  }

  function updateState(id: string, update: Partial<ResolveState>) {
    setResolveStates((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...update },
    }));
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

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["crisis"] });
    setRefreshing(false);
  }

  const activeAlerts = active?.data ?? [];
  const flaggedMsgs = flagged?.data ?? [];
  const historyEvents = history?.data ?? [];

  const resolveAlert = resolveSheetId
    ? activeAlerts.find((a) => a.id === resolveSheetId)
    : null;

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["top"]}
      >
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <Text variant="h1">{t.psychologist.crisis}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
          />
        }
      >
        {/* ── LEVEL LEGEND ── */}
        <Pressable
          onPress={() => { hapticLight(); setLegendOpen(!legendOpen); }}
          style={[styles.legendToggle, { marginBottom: 16 }]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${c.primary}1A` }]}>
              <Ionicons name="information-circle" size={14} color={c.primary} />
            </View>
            <Text variant="h3">{t.psychologist.crisisLevelLegend}</Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={c.textLight}
            style={{ transform: [{ rotate: legendOpen ? "180deg" : "0deg" }] }}
          />
        </Pressable>

        {legendOpen && (
          <View style={styles.legendCards}>
            {([
              { level: 1, title: t.psychologist.crisisLevel1Title, desc: t.psychologist.crisisLevel1Desc, bg: "#FACC151A", textColor: "#CA8A04", badgeBg: "#FACC15" },
              { level: 2, title: t.psychologist.crisisLevel2Title, desc: t.psychologist.crisisLevel2Desc, bg: `${c.warning}1A`, textColor: c.warning, badgeBg: c.warning },
              { level: 3, title: t.psychologist.crisisLevel3Title, desc: t.psychologist.crisisLevel3Desc, bg: `${c.danger}1A`, textColor: c.danger, badgeBg: c.danger },
            ] as const).map(({ level, title, desc, bg, textColor, badgeBg }) => (
              <View key={level} style={[styles.legendCard, { backgroundColor: bg }]}>
                <View style={[styles.legendBadge, { backgroundColor: badgeBg }]}>
                  <Text style={{ fontSize: 12, fontFamily: "DMSans-Bold", color: "#FFF" }}>{level}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontFamily: "DMSans-SemiBold", color: textColor }}>{title}</Text>
                  <Text variant="caption" style={{ marginTop: 2, lineHeight: 16 }}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── ACTIVE ALERTS ── */}
        <View style={styles.sectionHeader}>
          <View
            style={[styles.sectionIcon, { backgroundColor: `${c.danger}1A` }]}
          >
            <Ionicons name="alert-circle" size={14} color={c.danger} />
          </View>
          <Text variant="h3">{t.psychologist.activeAlerts}</Text>
          {activeAlerts.length > 0 && (
            <Badge count={activeAlerts.length} variant="danger" />
          )}
        </View>

        {activeLoading ? (
          <SkeletonList count={3} />
        ) : activeAlerts.length > 0 ? (
          <View style={styles.alertsList}>
            {activeAlerts.map((alert: SOSEvent) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                colors={c}
                t={t}
                formatTimeAgo={formatTimeAgo}
                onProfile={() =>
                  router.push(`/(screens)/students/${alert.userId}`)
                }
                onMessage={() => router.push("/(tabs)/messages")}
                onResolve={() => setResolveSheetId(alert.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: `${c.success}1A` },
              ]}
            >
              <Ionicons name="shield-checkmark" size={24} color={c.success} />
            </View>
            <Text
              variant="body"
              style={{ fontFamily: "DMSans-SemiBold", textAlign: "center" }}
            >
              {t.psychologist.noActiveAlerts}
            </Text>
            <Text variant="bodyLight">{t.psychologist.allStudentsSafe}</Text>
          </View>
        )}

        {/* ── FLAGGED MESSAGES ── */}
        {flaggedMsgs.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: `${c.warning}1A` },
                ]}
              >
                <Ionicons name="warning" size={14} color={c.warning} />
              </View>
              <Text variant="h3">{t.psychologist.flaggedMessages}</Text>
              <Badge count={flaggedMsgs.length} variant="primary" />
            </View>
            <View style={styles.alertsList}>
              {flaggedMsgs.map((msg: FlaggedMessage) => (
                <Pressable
                  key={msg.messageId}
                  onPress={() => router.push("/(tabs)/messages")}
                  style={({ pressed }) => [
                    styles.flaggedCard,
                    {
                      backgroundColor: c.surface,
                      borderColor: c.borderLight,
                    },
                    shadow(1),
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View
                    style={[
                      styles.flaggedIcon,
                      { backgroundColor: `${c.warning}1A` },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{"\u26A0\uFE0F"}</Text>
                  </View>
                  <View style={styles.flaggedContent}>
                    <View style={styles.flaggedTopRow}>
                      <View style={styles.flaggedNameRow}>
                        <Text
                          variant="body"
                          style={{ fontFamily: "DMSans-Bold" }}
                          numberOfLines={1}
                        >
                          {msg.studentName}
                        </Text>
                        {msg.studentGrade && (
                          <Text variant="caption">
                            {msg.studentGrade}
                            {msg.studentClass ?? ""}
                          </Text>
                        )}
                      </View>
                      <Text variant="caption">
                        {formatTimeAgo(msg.createdAt)}
                      </Text>
                    </View>
                    <Text
                      variant="body"
                      numberOfLines={2}
                      style={{ marginTop: 4 }}
                    >
                      {msg.content}
                    </Text>
                    {msg.sosEventId && (
                      <View
                        style={[
                          styles.linkedBadge,
                          { backgroundColor: `${c.danger}12` },
                        ]}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={10}
                          color={c.danger}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "DMSans-Bold",
                            color: c.danger,
                          }}
                        >
                          {t.psychologist.linkedAlert}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── RESOLVED HISTORY ── */}
        <Pressable
          onPress={() => {
            hapticLight();
            setHistoryOpen(!historyOpen);
          }}
          style={[styles.historyToggle, { marginTop: 20 }]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={c.success}
              />
            </View>
            <Text variant="h3">{t.psychologist.resolvedHistory}</Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={c.textLight}
            style={{
              transform: [{ rotate: historyOpen ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>

        {historyOpen && (
          <View style={{ marginTop: 8 }}>
            {historyLoading ? (
              <ActivityIndicator
                color={c.textLight}
                style={{ paddingVertical: 24 }}
              />
            ) : historyEvents.length > 0 ? (
              <View style={styles.alertsList}>
                {historyEvents.map((event: SOSEvent) => {
                  const isExpanded = expandedHistoryId === event.id;
                  const actions = [
                    { done: event.contactedStudent, label: t.psychologist.contactedStudentDone },
                    { done: event.contactedParent, label: t.psychologist.contactedParentDone },
                    { done: event.documented, label: t.psychologist.documentedDone },
                  ];
                  const hasAnyAction = actions.some((a) => a.done);

                  return (
                    <Pressable
                      key={event.id}
                      onPress={() => { hapticLight(); setExpandedHistoryId(isExpanded ? null : event.id); }}
                      style={[styles.historyCard, { backgroundColor: c.surface, borderColor: c.borderLight }]}
                    >
                      {/* Collapsed header row */}
                      <View style={styles.historyHeaderRow}>
                        <View style={[styles.historyIcon, { backgroundColor: `${c.success}12` }]}>
                          <Ionicons name="checkmark-circle" size={14} color={c.success} />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text variant="body" style={{ fontFamily: "DMSans-SemiBold" }} numberOfLines={1}>
                            {event.studentName ?? t.psychologist.student}
                          </Text>
                          {!isExpanded && event.notes && (
                            <Text variant="caption" numberOfLines={1}>{event.notes}</Text>
                          )}
                        </View>
                        <View style={styles.historyRight}>
                          <View style={[styles.levelBadge, { backgroundColor: event.level >= 3 ? `${c.danger}1A` : event.level === 2 ? `${c.warning}1A` : "#FACC151A" }]}>
                            <Text style={{ fontSize: 10, fontFamily: "DMSans-Bold", color: event.level >= 3 ? c.danger : event.level === 2 ? c.warning : "#CA8A04" }}>
                              L{event.level}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-down"
                            size={14}
                            color={c.textLight}
                            style={{ marginTop: 4, transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                          />
                        </View>
                      </View>

                      {/* Expanded details */}
                      {isExpanded && (
                        <View style={[styles.expandedDetails, { borderTopColor: c.borderLight }]}>
                          <View style={styles.detailGrid}>
                            <View style={styles.detailGridItem}>
                              <Text style={[styles.detailLabel, { color: c.textLight }]}>{t.psychologist.triggeredAt}</Text>
                              <Text style={[styles.detailValue, { color: c.text }]}>
                                {new Date(event.createdAt).toLocaleString()}
                              </Text>
                            </View>
                            {event.resolvedAt && (
                              <View style={styles.detailGridItem}>
                                <Text style={[styles.detailLabel, { color: c.textLight }]}>{t.psychologist.resolvedAtLabel}</Text>
                                <Text style={[styles.detailValue, { color: c.text }]}>
                                  {new Date(event.resolvedAt).toLocaleString()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.detailGridItem}>
                              <Text style={[styles.detailLabel, { color: c.textLight }]}>{t.psychologist.student}</Text>
                              <Text style={[styles.detailValue, { color: c.text }]}>
                                {event.studentName ?? "—"}
                                {event.studentGrade ? ` · ${event.studentGrade}${event.studentClassLetter ?? ""}` : ""}
                              </Text>
                            </View>
                            {event.resolvedByName && (
                              <View style={styles.detailGridItem}>
                                <Text style={[styles.detailLabel, { color: c.textLight }]}>{t.psychologist.resolvedByPsychologist}</Text>
                                <Text style={[styles.detailValue, { color: c.text }]}>{event.resolvedByName}</Text>
                              </View>
                            )}
                          </View>

                          {event.notes && (
                            <View style={[styles.notesBlock, { backgroundColor: c.surfaceSecondary }]}>
                              <Text style={{ fontSize: 13, color: c.text, lineHeight: 20 }}>{event.notes}</Text>
                            </View>
                          )}

                          <View style={styles.checklistSection}>
                            <Text style={[styles.detailLabel, { color: c.textLight, marginBottom: 6 }]}>{t.psychologist.actionsTaken}</Text>
                            {hasAnyAction ? (
                              <View style={{ gap: 4 }}>
                                {actions.map(({ done, label }) => (
                                  <View key={label} style={styles.checklistItem}>
                                    <Ionicons
                                      name={done ? "checkmark" : "remove"}
                                      size={12}
                                      color={done ? c.success : c.textLight}
                                    />
                                    <Text style={{ fontSize: 12, color: done ? c.text : c.textLight }}>{label}</Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <Text style={{ fontSize: 12, color: c.textLight }}>{t.psychologist.noActionsTaken}</Text>
                            )}
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text
                variant="bodyLight"
                style={{ textAlign: "center", paddingVertical: 24 }}
              >
                {t.common.noData}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── RESOLVE BOTTOM SHEET ── */}
      <Modal
        visible={!!resolveAlert}
        transparent
        animationType="slide"
        onRequestClose={() => setResolveSheetId(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View style={styles.sheetWrapper}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setResolveSheetId(null)}
          />
          <View
            style={[styles.sheetContent, { backgroundColor: c.surface }]}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle}>
              <View
                style={[styles.dragBar, { backgroundColor: c.border }]}
              />
            </View>

            {resolveAlert && (
              <View style={styles.sheetInner}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetHeaderLeft}>
                    <View
                      style={[
                        styles.sheetAvatar,
                        { backgroundColor: `${c.danger}1A` },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "DMSans-Bold",
                          color: c.danger,
                        }}
                      >
                        {(resolveAlert.studentName ?? "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text
                        variant="h3"
                        style={{ fontFamily: "DMSans-Bold" }}
                      >
                        {resolveAlert.studentName ?? t.psychologist.student}
                      </Text>
                      <Text variant="caption">
                        {t.psychologist.resolve}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setResolveSheetId(null)}
                    style={[
                      styles.closeBtn,
                      { backgroundColor: c.surfaceSecondary },
                    ]}
                  >
                    <Ionicons name="close" size={16} color={c.textLight} />
                  </Pressable>
                </View>

                {/* Checklist */}
                <View style={styles.checklist}>
                  {(
                    [
                      {
                        key: "contactedStudent" as const,
                        icon: "call-outline" as const,
                        label: t.psychologist.contactStudent,
                      },
                      {
                        key: "contactedParent" as const,
                        icon: "people-outline" as const,
                        label: t.psychologist.contactParent,
                      },
                      {
                        key: "documented" as const,
                        icon: "document-text-outline" as const,
                        label: t.psychologist.documentActions,
                      },
                    ] as const
                  ).map(({ key, icon, label }) => {
                    const state = getState(resolveAlert.id);
                    const active = state[key];
                    return (
                      <Pressable
                        key={key}
                        onPress={() => {
                          hapticLight();
                          updateState(resolveAlert.id, {
                            [key]: !active,
                          });
                        }}
                        style={[
                          styles.checkItem,
                          {
                            backgroundColor: active
                              ? `${c.success}12`
                              : c.surfaceSecondary,
                            borderColor: active
                              ? `${c.success}30`
                              : "transparent",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: active
                                ? c.success
                                : "transparent",
                              borderColor: active
                                ? c.success
                                : c.inputBorder,
                            },
                          ]}
                        >
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFF"
                            />
                          )}
                        </View>
                        <Ionicons
                          name={icon}
                          size={18}
                          color={active ? c.success : c.textLight}
                        />
                        <Text
                          variant="body"
                          style={
                            active
                              ? { fontFamily: "DMSans-SemiBold" }
                              : undefined
                          }
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Notes */}
                <TextInput
                  value={getState(resolveAlert.id).notes}
                  onChangeText={(text) =>
                    updateState(resolveAlert.id, { notes: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder={t.psychologist.resolveNotesPlaceholder}
                  placeholderTextColor={c.textLight}
                  style={[
                    styles.notesInput,
                    {
                      borderColor: c.inputBorder,
                      backgroundColor: c.surfaceSecondary,
                      color: c.text,
                    },
                  ]}
                />

                {/* Submit */}
                <Pressable
                  onPress={() =>
                    resolveMutation.mutate({
                      id: resolveAlert.id,
                      data: getState(resolveAlert.id),
                    })
                  }
                  disabled={
                    !getState(resolveAlert.id).notes.trim() ||
                    resolveMutation.isPending
                  }
                  style={({ pressed }) => [
                    styles.resolveBtn,
                    { backgroundColor: c.success },
                    pressed && { opacity: 0.9 },
                    (!getState(resolveAlert.id).notes.trim() ||
                      resolveMutation.isPending) && { opacity: 0.4 },
                  ]}
                >
                  {resolveMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FFF"
                    />
                  )}
                  <Text style={styles.resolveBtnText}>
                    {t.psychologist.resolve}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Alert Card component ── */

function AlertCard({
  alert,
  colors: c,
  t,
  formatTimeAgo,
  onProfile,
  onMessage,
  onResolve,
}: {
  alert: SOSEvent;
  colors: any;
  t: any;
  formatTimeAgo: (d: string) => string;
  onProfile: () => void;
  onMessage: () => void;
  onResolve: () => void;
}) {
  const isCritical = alert.level >= 3;

  // Pulse animation for L3
  const pulse = useSharedValue(1);
  if (isCritical) {
    pulse.value = withRepeat(
      withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: isCritical
      ? `rgba(179,59,59,${pulse.value})`
      : c.borderLight,
    borderWidth: isCritical ? 2 : 1,
  }));

  const levelColors =
    alert.level >= 3
      ? { bg: c.danger, text: "#FFF" }
      : alert.level === 2
        ? { bg: c.warning, text: "#FFF" }
        : { bg: "#FACC15", text: "#FFF" };

  return (
    <Animated.View
      style={[
        styles.alertCard,
        { backgroundColor: c.surface },
        shadow(1),
        pulseStyle,
      ]}
    >
      {isCritical && (
        <View style={[styles.accentBar, { backgroundColor: c.danger }]} />
      )}

      <View style={styles.alertInner}>
        {/* Name + level + time */}
        <View style={styles.alertTopRow}>
          <View
            style={[
              styles.alertAvatar,
              { backgroundColor: `${c.danger}1A` },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "DMSans-Bold",
                color: c.danger,
              }}
            >
              {(alert.studentName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.alertInfo}>
            <Text
              variant="body"
              style={{ fontFamily: "DMSans-Bold" }}
              numberOfLines={1}
            >
              {alert.studentName ?? t.psychologist.student}
            </Text>
            <View style={styles.alertMeta}>
              {alert.studentGrade != null && (
                <>
                  <Text variant="caption">
                    {alert.studentGrade}
                    {alert.studentClassLetter ?? ""}
                  </Text>
                  <Text variant="caption" style={{ opacity: 0.3 }}>
                    {" "}
                    ·{" "}
                  </Text>
                </>
              )}
              <Ionicons name="time-outline" size={11} color={c.textLight} />
              <Text variant="caption"> {formatTimeAgo(alert.createdAt)}</Text>
            </View>
          </View>
          <View
            style={[styles.levelBadgeLg, { backgroundColor: levelColors.bg }]}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "DMSans-Bold",
                color: levelColors.text,
              }}
            >
              {alert.level}
            </Text>
          </View>
        </View>

        {/* Student note */}
        {alert.notes && (
          <View
            style={[
              styles.alertNote,
              {
                backgroundColor: `${c.danger}08`,
                borderColor: `${c.danger}15`,
              },
            ]}
          >
            <Text variant="body" style={{ lineHeight: 20 }}>
              {alert.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              hapticLight();
              onProfile();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: c.surfaceSecondary },
              pressed && { backgroundColor: c.surfaceHover },
            ]}
          >
            <Ionicons name="person" size={16} color={c.primary} />
            <Text style={[styles.actionLabel, { color: c.text }]}>
              {t.psychologist.viewProfile}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              onMessage();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: c.surfaceSecondary },
              pressed && { backgroundColor: c.surfaceHover },
            ]}
          >
            <Ionicons name="chatbubble" size={16} color={c.success} />
            <Text style={[styles.actionLabel, { color: c.text }]}>
              {t.psychologist.writeMessage}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              onResolve();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: c.surfaceSecondary },
              pressed && { backgroundColor: c.surfaceHover },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={c.textLight}
            />
            <Text style={[styles.actionLabel, { color: c.text }]}>
              {t.psychologist.resolve}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  alertsList: { gap: 10 },
  alertCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
  },
  alertInner: { padding: 16 },
  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  alertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: { flex: 1, minWidth: 0 },
  alertMeta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  levelBadgeLg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  alertNote: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: "DMSans-SemiBold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  // Flagged
  flaggedCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  flaggedIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedContent: { flex: 1, minWidth: 0 },
  flaggedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  flaggedNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 6,
  },
  // History
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1, minWidth: 0 },
  historyRight: { alignItems: "flex-end" },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  legendToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  legendCards: { gap: 8, marginBottom: 16 },
  legendCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  legendBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
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
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailGridItem: {
    width: "50%" as any,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: "DMSans-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: "DMSans-Medium",
    marginTop: 2,
  },
  notesBlock: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  checklistSection: {
    marginTop: 2,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Resolve sheet
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  dragHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetInner: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checklist: { gap: 8, marginBottom: 16 },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    minHeight: 72,
  },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  resolveBtnText: {
    fontSize: 15,
    fontFamily: "DMSans-Bold",
    color: "#FFF",
  },
});
