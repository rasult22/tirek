import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Input, StatusBadge, H3, Body, MoodScale } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { FiltersSheet } from "../../components/student/FiltersSheet";
import { PendingList } from "../../components/student/PendingList";
import {
  GenerateCodesSheet,
  type GenerateCodesPrefill,
} from "../../components/student/GenerateCodesSheet";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { studentsApi } from "../../lib/api/students";
import { inactivityApi } from "../../lib/api/inactivity";
import { hapticLight } from "../../lib/haptics";

type Segment = "active" | "pending";

export default function StudentsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [segment, setSegment] = useState<Segment>("active");
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrefill, setSheetPrefill] = useState<GenerateCodesPrefill | null>(
    null,
  );

  const hasActiveFilter = grade !== null || classLetter !== null;

  const {
    data: students,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "students",
      {
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      },
    ],
    queryFn: () =>
      studentsApi.getAll({
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      }),
    enabled: segment === "active",
  });

  const { data: inactiveData } = useQuery({
    queryKey: ["inactivity", "list"],
    queryFn: () => inactivityApi.list(),
    enabled: segment === "active",
  });
  const inactiveIds = useMemo(
    () => new Set((inactiveData?.data ?? []).map((s) => s.studentId)),
    [inactiveData],
  );

  const filteredAndSorted = useMemo(() => {
    if (!students?.data) return [];
    let result = students.data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((st) => st.name.toLowerCase().includes(s));
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [students, search]);

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["students"] });
    setRefreshing(false);
  }

  function openAddSheet() {
    setSheetPrefill(null);
    setSheetOpen(true);
  }

  function openGenerateNew(prefill: GenerateCodesPrefill) {
    setSheetPrefill(prefill);
    setSheetOpen(true);
  }

  function handleSheetSuccess() {
    setSheetOpen(false);
    setSheetPrefill(null);
    setSegment("pending");
  }

  if (isError && segment === "active") {
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
      <View style={styles.header}>
        <H3>{t.psychologist.students}</H3>
        {segment === "active" && (
          <Pressable
            onPress={() => {
              hapticLight();
              setFiltersOpen(true);
            }}
            accessibilityLabel={t.common.filters}
            hitSlop={8}
            style={({ pressed }) => [
              styles.filterButton,
              { borderColor: c.border, backgroundColor: c.surface },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="filter-outline" size={18} color={c.text} />
            {hasActiveFilter && (
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: c.primary, borderColor: c.surface },
                ]}
              />
            )}
          </Pressable>
        )}
      </View>

      {/* Segmented control */}
      <View
        style={[
          styles.segmentWrap,
          { backgroundColor: c.surfaceSecondary },
        ]}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            setSegment("active");
          }}
          style={[
            styles.segmentBtn,
            segment === "active" && {
              backgroundColor: c.surface,
              ...shadow(1),
            },
          ]}
        >
          <Body
            size="sm"
            style={{
              fontWeight: "600",
              color: segment === "active" ? c.text : c.textLight,
            }}
          >
            {t.psychologist.studentsTabActive}
          </Body>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            setSegment("pending");
          }}
          style={[
            styles.segmentBtn,
            segment === "pending" && {
              backgroundColor: c.surface,
              ...shadow(1),
            },
          ]}
        >
          <Body
            size="sm"
            style={{
              fontWeight: "600",
              color: segment === "pending" ? c.text : c.textLight,
            }}
          >
            {t.psychologist.studentsTabPending}
          </Body>
        </Pressable>
      </View>

      {segment === "active" ? (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <Input
              icon="search-outline"
              value={search}
              onChangeText={setSearch}
              placeholder={`${t.common.search}...`}
            />
          </View>

          {/* Student list */}
          {isLoading ? (
            <SkeletonList count={6} />
          ) : filteredAndSorted.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: `${c.textLight}1A` },
                ]}
              >
                <Ionicons name="people-outline" size={32} color={c.textLight} />
              </View>
              <Text variant="bodyLight">{t.common.noData}</Text>
            </View>
          ) : (
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
              {filteredAndSorted.map((student) => (
                <Pressable
                  key={student.id}
                  onPress={() => {
                    hapticLight();
                    router.push(`/(screens)/students/${student.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.studentCard,
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
                    <Body
                      size="sm"
                      style={{
                        fontWeight: "600",
                        color: c.primary,
                      }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </Body>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Body
                        style={{
                          fontWeight: "600",
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {student.name}
                      </Body>
                      <StatusBadge status={student.status} size="sm" />
                      {inactiveIds.has(student.id) && (
                        <View
                          style={[
                            styles.inactiveBadge,
                            {
                              backgroundColor: `${c.warning}1A`,
                              borderColor: `${c.warning}40`,
                            },
                          ]}
                        >
                          <Ionicons name="moon" size={10} color={c.warning} />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: c.warning,
                            }}
                          >
                            {t.psychologist.inactiveBadge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.metaRow}>
                      <Body size="xs" style={{ color: c.textLight }}>
                        {student.grade != null
                          ? `${student.grade}${student.classLetter ?? ""}`
                          : "—"}
                      </Body>
                      <Body size="xs" style={{ color: c.textLight }}> · </Body>
                      {student.lastMood != null ? (
                        <MoodScale
                          value={student.lastMood as 1 | 2 | 3 | 4 | 5}
                        />
                      ) : (
                        <Body size="xs" style={{ color: c.textLight }}>—</Body>
                      )}
                      <Body size="xs" style={{ color: c.textLight }}> · </Body>
                      <Body size="xs" style={{ color: c.textLight }}>
                        {student.lastActive
                          ? new Date(student.lastActive).toLocaleDateString()
                          : "—"}
                      </Body>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={`${c.textLight}60`}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <PendingList onGenerateNew={openGenerateNew} />
      )}

      {/* Sticky add button — fixed above tabbar */}
      <View
        pointerEvents="box-none"
        style={styles.stickyWrap}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            openAddSheet();
          }}
          style={({ pressed }) => [
            styles.stickyBtn,
            { backgroundColor: c.primary },
            shadow(3),
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Body
            size="sm"
            style={{
              color: "#FFF",
              fontWeight: "600",
            }}
          >
            {t.psychologist.addNewStudent}
          </Body>
        </Pressable>
      </View>

      <FiltersSheet
        open={filtersOpen}
        grade={grade}
        classLetter={classLetter}
        onClose={() => setFiltersOpen(false)}
        onApply={({ grade: g, classLetter: l }) => {
          setGrade(g);
          setClassLetter(l);
        }}
      />

      <GenerateCodesSheet
        open={sheetOpen}
        prefill={sheetPrefill}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSheetSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 48,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 3,
    borderRadius: radius.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 8,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  inactiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
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
  stickyWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  stickyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
});
