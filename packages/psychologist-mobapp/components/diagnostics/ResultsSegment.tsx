import { useState, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, SeverityBadge } from "../ui";
import { SkeletonList } from "../Skeleton";
import { ErrorState } from "../ErrorState";
import { AiReportCard } from "./AiReportCard";
import {
  diagnosticsApi,
  type DiagnosticsFilters,
} from "../../lib/api/diagnostics";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

interface Props {
  filters: DiagnosticsFilters;
}

export function ResultsSegment({ filters }: Props) {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [reportSession, setReportSession] = useState<{
    sessionId: string;
    studentName?: string;
    testName?: string | null;
  } | null>(null);

  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["diagnostics", "results", filters],
    queryFn: () => diagnosticsApi.getResults(filters),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
    setRefreshing(false);
  }, [queryClient]);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }
  if (isLoading) return <SkeletonList count={5} />;

  if (!results || results.data.length === 0) {
    return (
      <View style={styles.empty}>
        <View
          style={[styles.emptyIcon, { backgroundColor: `${c.textLight}1A` }]}
        >
          <Ionicons name="clipboard-outline" size={32} color={c.textLight} />
        </View>
        <Text variant="bodyLight">{t.common.noData}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
          />
        }
      >
        {results.data.map((row) => (
          <Pressable
            key={row.sessionId}
            onPress={() => {
              hapticLight();
              router.push(`/(screens)/students/${row.studentId}` as any);
            }}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: c.surface, borderColor: c.borderLight },
              shadow(1),
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.avatar, { backgroundColor: `${c.primary}1A` }]}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: c.primary,
                  }}
                >
                  {(row.studentName ?? "S").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text
                    variant="body"
                    style={{ fontWeight: "600", flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {row.studentName ?? "Student"}
                  </Text>
                  {row.studentGrade != null && (
                    <Text variant="caption">
                      {row.studentGrade}
                      {row.studentClass ?? ""}
                    </Text>
                  )}
                </View>
                <View style={styles.metaRow}>
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    {row.testName ?? row.testSlug ?? row.testId}
                  </Text>
                  <Text variant="caption"> · </Text>
                  <Text variant="caption">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString()
                      : "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreCol}>
                {row.totalScore != null && (
                  <Text
                    variant="small"
                    style={{ fontWeight: "700", color: c.text }}
                  >
                    {row.totalScore}/{row.maxScore ?? "?"}
                  </Text>
                )}
                {row.severity && <SeverityBadge severity={row.severity} />}
              </View>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                hapticLight();
                setReportSession({
                  sessionId: row.sessionId,
                  studentName: row.studentName,
                  testName: row.testName,
                });
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.aiBtn,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="sparkles" size={16} color="#FFF" />
              <Text style={styles.aiBtnLabel}>Прочитать AI-отчёт</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFF" />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={!!reportSession}
        transparent
        animationType="slide"
        onRequestClose={() => setReportSession(null)}
      >
        <View style={styles.sheetWrapper}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setReportSession(null)}
          />
          <View style={[styles.sheetContent, { backgroundColor: c.surface }]}>
            <View style={styles.dragHandle}>
              <View style={[styles.dragBar, { backgroundColor: c.border }]} />
            </View>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="h3" style={{ fontWeight: "700" }}>
                  AI-анализ
                </Text>
                {reportSession?.studentName && (
                  <Text variant="caption">
                    {reportSession.studentName}
                    {reportSession.testName
                      ? ` · ${reportSession.testName}`
                      : ""}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setReportSession(null)}
                style={[
                  styles.closeBtn,
                  { backgroundColor: c.surfaceSecondary },
                ]}
              >
                <Ionicons name="close" size={16} color={c.textLight} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
            >
              {reportSession && (
                <AiReportCard sessionId={reportSession.sessionId} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  scoreCol: { alignItems: "flex-end", gap: 4 },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  aiBtnLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetWrapper: { flex: 1, justifyContent: "flex-end" },
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
  dragBar: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
