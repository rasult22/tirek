import { useState, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, SeverityBadge } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { diagnosticsApi } from "../../lib/api/diagnostics";
import { exportApi } from "../../lib/api/export";
import { hapticLight } from "../../lib/haptics";
import { AiReportCard } from "../../components/diagnostics/AiReportCard";
import type { Severity } from "@tirek/shared";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const TEST_SLUGS = ["phq-a", "gad-7", "rosenberg"] as const;
const SEVERITIES: Severity[] = ["minimal", "mild", "moderate", "severe"];

export default function DiagnosticsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [testSlug, setTestSlug] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reportSession, setReportSession] = useState<{
    sessionId: string;
    studentName?: string;
    testName?: string | null;
  } | null>(null);

  const testLabels: Record<string, string> = {
    "phq-a": t.tests.phqName,
    "gad-7": t.tests.gadName,
    rosenberg: t.tests.rosenbergName,
  };

  const severityLabels: Record<string, string> = {
    minimal: t.severity.minimal,
    mild: t.severity.mild,
    moderate: t.severity.moderate,
    severe: t.severity.severe,
  };

  const filters = {
    testSlug: testSlug ?? undefined,
    severity: severity ?? undefined,
    grade: grade ?? undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  };

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

  const handleExport = async () => {
    hapticLight();
    try {
      await exportApi.classCSV(grade ?? undefined);
    } catch {
      // share cancelled or download failed — silently ignore
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text variant="h2">{t.psychologist.diagnostics}</Text>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/(screens)/diagnostics/assign" as any);
            }}
            style={[styles.assignBtn, { backgroundColor: c.primary }]}
          >
            <Ionicons name="clipboard-outline" size={14} color="#FFF" />
            <Text style={styles.assignBtnText}>{t.psychologist.assignTest}</Text>
          </Pressable>
        </View>

        {/* Test filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          <Pressable
            onPress={() => {
              hapticLight();
              setTestSlug(null);
            }}
            style={[
              styles.chip,
              testSlug === null
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: testSlug === null ? "#FFF" : c.textLight,
              }}
            >
              {t.psychologist.allGrades.split(" ")[0] === "Все" ? "Все тесты" : "All"}
            </Text>
          </Pressable>
          {TEST_SLUGS.map((slug) => (
            <Pressable
              key={slug}
              onPress={() => {
                hapticLight();
                setTestSlug(testSlug === slug ? null : slug);
              }}
              style={[
                styles.chip,
                testSlug === slug
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: testSlug === slug ? "#FFF" : c.textLight,
                }}
                numberOfLines={1}
              >
                {testLabels[slug] ?? slug}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Severity + Grade chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          <Pressable
            onPress={() => {
              hapticLight();
              setSeverity(null);
            }}
            style={[
              styles.chip,
              severity === null
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: severity === null ? "#FFF" : c.textLight,
              }}
            >
              {t.psychologist.allClasses.split(" ")[0] === "Все" ? "Все" : "All"}
            </Text>
          </Pressable>
          {SEVERITIES.map((sev) => (
            <Pressable
              key={sev}
              onPress={() => {
                hapticLight();
                setSeverity(severity === sev ? null : sev);
              }}
              style={[
                styles.chip,
                severity === sev
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: severity === sev ? "#FFF" : c.textLight,
                }}
              >
                {severityLabels[sev]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

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

        {/* Date filters + Export */}
        <View style={styles.dateRow}>
          <View
            style={[
              styles.dateInput,
              { borderColor: c.borderLight, backgroundColor: c.surface },
            ]}
          >
            <Ionicons name="calendar-outline" size={14} color={c.textLight} />
            <TextInput
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textLight}
              style={[styles.dateText, { color: c.text }]}
              maxLength={10}
            />
          </View>
          <View
            style={[
              styles.dateInput,
              { borderColor: c.borderLight, backgroundColor: c.surface },
            ]}
          >
            <Ionicons name="calendar-outline" size={14} color={c.textLight} />
            <TextInput
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textLight}
              style={[styles.dateText, { color: c.text }]}
              maxLength={10}
            />
          </View>
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

        {/* Results */}
        {isLoading ? (
          <SkeletonList count={5} />
        ) : results && results.data.length > 0 ? (
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
                  styles.resultCard,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.borderLight,
                  },
                  shadow(1),
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: `${c.primary}1A` },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "DMSans-SemiBold",
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
                      style={{ fontFamily: "DMSans-SemiBold", flexShrink: 1 }}
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
                    <Text variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
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
                      style={{ fontFamily: "DMSans-Bold" }}
                    >
                      {row.totalScore}/{row.maxScore ?? "?"}
                    </Text>
                  )}
                  {row.severity && <SeverityBadge severity={row.severity} />}
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
                  style={({ pressed }) => [
                    styles.aiBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="sparkles" size={12} color="#4338CA" />
                </Pressable>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={`${c.textLight}60`}
                />
              </Pressable>
            ))}
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
                name="clipboard-outline"
                size={32}
                color={c.textLight}
              />
            </View>
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* AI Report Modal */}
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
                <Text variant="h3" style={{ fontFamily: "DMSans-Bold" }}>
                  AI-анализ
                </Text>
                {reportSession?.studentName && (
                  <Text variant="caption">
                    {reportSession.studentName}
                    {reportSession.testName ? ` · ${reportSession.testName}` : ""}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setReportSession(null)}
                style={[styles.closeBtn, { backgroundColor: c.surfaceSecondary }]}
              >
                <Ionicons name="close" size={16} color={c.textLight} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
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
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  assignBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "DMSans-SemiBold",
  },
  chipsScroll: {
    maxHeight: 36,
    marginBottom: 4,
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
  dateRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "DMSans-Regular",
    padding: 0,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  scoreCol: {
    alignItems: "flex-end",
    gap: 4,
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
  aiBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
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
