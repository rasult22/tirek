import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  SectionList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Input, H3, Body } from "../../components/ui";
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
import type { StudentOverview } from "@tirek/shared";

type Segment = "active" | "pending";

type StudentSection = {
  title: string;
  /** Sort key — grade*10 + letter index; "Без класса" goes to end. */
  sortKey: number;
  count: number;
  data: StudentOverview[];
};

const NO_CLASS_LABEL = "Без класса";

function classKey(s: StudentOverview): string {
  if (s.grade == null) return NO_CLASS_LABEL;
  return `${s.grade}${s.classLetter ?? ""}`;
}

function classSortKey(s: StudentOverview): number {
  if (s.grade == null) return Number.MAX_SAFE_INTEGER;
  // grade major, classLetter minor (А=0, Б=1, ...)
  const letter = s.classLetter ?? "";
  return s.grade * 100 + (letter ? letter.charCodeAt(0) : 0);
}

function buildSections(students: StudentOverview[]): StudentSection[] {
  const map = new Map<string, StudentSection>();
  for (const s of students) {
    const title = classKey(s);
    let section = map.get(title);
    if (!section) {
      section = {
        title,
        sortKey: classSortKey(s),
        count: 0,
        data: [],
      };
      map.set(title, section);
    }
    section.data.push(s);
    section.count += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
}

/** Risk stripe color from current student status. */
function statusStripeColor(
  status: StudentOverview["status"],
  c: ReturnType<typeof useThemeColors>,
): string {
  switch (status) {
    case "crisis":
      return c.danger;
    case "attention":
      return c.warning;
    case "normal":
    default:
      return c.success;
  }
}

function moodLabel(value: number): string {
  // 1-5 scale; humanize succinctly.
  return `${value}/5`;
}

function relativeDayDelta(iso: string): number {
  const d = new Date(iso);
  const today = new Date();
  const startD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const startToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.round((startToday - startD) / 86_400_000);
}

/**
 * Pick ONE most recent/important signal for the row.
 * Priority:
 *   1. Inactivity (if listed as inactive) → "не входил N дн."
 *   2. lastMood available → "настроение N/5 (сегодня|вчера|N дн. назад)"
 *      using lastActive as a proxy for "when".
 *   3. lastActive only → "был N дн. назад"
 *   4. Nothing → "—"
 */
function pickSignal(
  s: StudentOverview,
  daysInactive: number | null | undefined,
): string {
  if (daysInactive != null && daysInactive > 0) {
    return `не входил ${daysInactive} дн.`;
  }
  if (s.lastMood != null) {
    const when = s.lastActive ? whenLabel(s.lastActive) : null;
    return when
      ? `настроение ${moodLabel(s.lastMood)} · ${when}`
      : `настроение ${moodLabel(s.lastMood)}`;
  }
  if (s.lastActive) {
    const when = whenLabel(s.lastActive);
    return when === "сегодня" ? "был сегодня" : `был ${when}`;
  }
  return "—";
}

function whenLabel(iso: string): string {
  const delta = relativeDayDelta(iso);
  if (delta <= 0) return "сегодня";
  if (delta === 1) return "вчера";
  return `${delta} дн. назад`;
}

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
  const inactiveDaysById = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const it of inactiveData?.data ?? []) {
      map.set(it.studentId, it.daysInactive);
    }
    return map;
  }, [inactiveData]);

  const filteredAndSorted = useMemo(() => {
    if (!students?.data) return [];
    let result = students.data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((st) => st.name.toLowerCase().includes(s));
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [students, search]);

  const sections = useMemo(
    () => buildSections(filteredAndSorted),
    [filteredAndSorted],
  );

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

          {/* Student list, grouped by class */}
          {isLoading ? (
            <SkeletonList count={6} />
          ) : sections.length === 0 ? (
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
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={c.primary}
                />
              }
              renderSectionHeader={({ section }) => (
                <View
                  style={[
                    styles.sectionHeader,
                    {
                      backgroundColor: c.bg,
                      borderBottomColor: c.borderLight,
                    },
                  ]}
                >
                  <Body
                    size="sm"
                    style={{
                      fontWeight: "700",
                      color: c.text,
                      letterSpacing: 0.2,
                    }}
                  >
                    {section.title}{" "}
                    <Body size="sm" style={{ color: c.textLight }}>
                      ({section.count})
                    </Body>
                  </Body>
                </View>
              )}
              renderItem={({ item }) => {
                const stripe = statusStripeColor(item.status, c);
                const days = inactiveDaysById.get(item.id) ?? null;
                const signal = pickSignal(item, days);
                return (
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      router.push(`/(screens)/students/${item.id}`);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: c.surface,
                        borderBottomColor: c.borderLight,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View
                      style={[styles.stripe, { backgroundColor: stripe }]}
                    />
                    <View style={styles.rowBody}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: c.text,
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: c.textLight,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {signal}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={`${c.textLight}60`}
                    />
                  </Pressable>
                );
              }}
            />
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
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stripe: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: 12,
    minHeight: 36,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
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
