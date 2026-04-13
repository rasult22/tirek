import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useT } from "../../../lib/hooks/useLanguage";
import { Text, Button } from "../../../components/ui";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { StudentHeroCard } from "../../../components/student/StudentHeroCard";
import { StudentOverviewTab } from "../../../components/student/StudentOverviewTab";
import { StudentAssessmentsTab } from "../../../components/student/StudentAssessmentsTab";
import { StudentNotesTab } from "../../../components/student/StudentNotesTab";
import { ActionMenu } from "../../../components/student/ActionMenu";
import { useThemeColors, spacing, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { studentsApi } from "../../../lib/api/students";
import { notesApi } from "../../../lib/api/notes";
import { achievementsApi } from "../../../lib/api/achievements";
import { cbtApi } from "../../../lib/api/cbt";
import { exportApi } from "../../../lib/api/export";
import { directChatApi } from "../../../lib/api/direct-chat";
import {
  calculateMoodTrend,
  calculateEngagement,
} from "../../../lib/utils/mood-analytics";
import { hapticSuccess } from "../../../lib/haptics";

type Tab = "overview" | "assessments" | "notes";

export default function StudentDetailScreen() {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showDetachConfirm, setShowDetachConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes", id],
    queryFn: () => notesApi.getAll(id!),
    enabled: !!id && activeTab === "notes",
  });

  const { data: studentAchievements, isLoading: achievementsLoading } =
    useQuery({
      queryKey: ["achievements", id],
      queryFn: () => achievementsApi.getStudentAchievements(id!),
      enabled: !!id,
    });

  const { data: cbtEntries, isLoading: cbtLoading } = useQuery({
    queryKey: ["cbt", id],
    queryFn: () => cbtApi.getStudentEntries(id!),
    enabled: !!id,
  });

  const detachMutation = useMutation({
    mutationFn: () => studentsApi.detach(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      hapticSuccess();
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
      queryClient.invalidateQueries({ queryKey: ["notes", id] }),
      queryClient.invalidateQueries({ queryKey: ["achievements", id] }),
      queryClient.invalidateQueries({ queryKey: ["cbt", id] }),
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

  const { student, status, moodHistory, testResults } = data;

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "overview", label: d.overview, icon: "grid-outline" },
    { key: "assessments", label: d.assessments, icon: "clipboard-outline" },
    { key: "notes", label: t.psychologist.notes, icon: "document-text-outline" },
  ];

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
        {/* Action row */}
        <View style={styles.actionRow}>
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
          <ActionMenu
            onExportCSV={async () => {
              try { await exportApi.studentCSV(id!); } catch { /* ignore */ }
            }}
            onDetach={() => setShowDetachConfirm(true)}
          />
        </View>

        {/* Hero */}
        <StudentHeroCard
          student={student}
          status={status}
          moodTrend={moodTrend}
          engagement={engagement}
        />

        {/* Tab bar */}
        <View
          style={[styles.tabBar, { backgroundColor: c.surfaceSecondary }]}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                activeTab === tab.key && [
                  { backgroundColor: c.surface },
                  shadow(1),
                ],
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={activeTab === tab.key ? c.primary : c.textLight}
              />
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: activeTab === tab.key ? c.primary : c.textLight,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "overview" && (
          <StudentOverviewTab
            moodTrend={moodTrend}
            moodHistory={moodHistory}
            testResults={testResults}
            cbtEntries={cbtEntries?.data}
            cbtLoading={cbtLoading}
            achievements={studentAchievements}
            achievementsLoading={achievementsLoading}
            onSwitchToAssessments={() => setActiveTab("assessments")}
          />
        )}

        {activeTab === "assessments" && (
          <StudentAssessmentsTab
            testResults={testResults}
            cbtEntries={cbtEntries?.data}
            cbtLoading={cbtLoading}
            achievements={studentAchievements}
            achievementsLoading={achievementsLoading}
          />
        )}

        {activeTab === "notes" && (
          <StudentNotesTab
            studentId={id!}
            notes={notes}
            notesLoading={notesLoading}
          />
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={showDetachConfirm}
        onCancel={() => setShowDetachConfirm(false)}
        onConfirm={() => detachMutation.mutate()}
        title={t.psychologist.detachConfirmTitle}
        description={t.psychologist.detachConfirmDescription}
        confirmLabel={t.psychologist.detachStudent}
        variant="danger"
      />
    </>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: radius.sm,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm - 2,
  },
});
