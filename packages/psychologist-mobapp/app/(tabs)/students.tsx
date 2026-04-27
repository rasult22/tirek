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
import { Text, Input, StatusBadge } from "../../components/ui";
import { SkeletonList } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { FiltersSheet } from "../../components/student/FiltersSheet";
import { useThemeColors, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { studentsApi } from "../../lib/api/students";
import { inactivityApi } from "../../lib/api/inactivity";
import { hapticLight } from "../../lib/haptics";

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

export default function StudentsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  });

  const { data: inactiveData } = useQuery({
    queryKey: ["inactivity", "list"],
    queryFn: () => inactivityApi.list(),
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
      <View style={styles.header}>
        <Text variant="h1">{t.psychologist.students}</Text>
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
      </View>

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
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "DMSans-SemiBold",
                    color: c.primary,
                  }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text
                    variant="body"
                    style={{ fontFamily: "DMSans-SemiBold", flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {student.name}
                  </Text>
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
                  <Text variant="caption">
                    {student.grade != null
                      ? `${student.grade}${student.classLetter ?? ""}`
                      : "—"}
                  </Text>
                  <Text variant="caption"> · </Text>
                  <Text variant="caption">
                    {student.lastMood != null
                      ? (moodEmojis[student.lastMood] ?? "—")
                      : "—"}
                  </Text>
                  <Text variant="caption"> · </Text>
                  <Text variant="caption">
                    {student.lastActive
                      ? new Date(student.lastActive).toLocaleDateString()
                      : "—"}
                  </Text>
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
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
});
