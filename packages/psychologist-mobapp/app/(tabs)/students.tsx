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
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { studentsApi } from "../../lib/api/students";
import { hapticLight } from "../../lib/haptics";

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["A", "B", "C", "D", "E"];

export default function StudentsScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

      {/* Class letter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.classChipsScroll}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            setClassLetter(null);
          }}
          style={[
            styles.chip,
            classLetter === null
              ? { backgroundColor: c.primary }
              : { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <Text
            variant="small"
            style={{
              fontFamily: "DMSans-SemiBold",
              color: classLetter === null ? "#FFF" : c.textLight,
            }}
          >
            {t.psychologist.allClasses}
          </Text>
        </Pressable>
        {CLASS_LETTERS.map((l) => (
          <Pressable
            key={l}
            onPress={() => {
              hapticLight();
              setClassLetter(classLetter === l ? null : l);
            }}
            style={[
              styles.chip,
              classLetter === l
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.surfaceSecondary },
            ]}
          >
            <Text
              variant="small"
              style={{
                fontFamily: "DMSans-SemiBold",
                color: classLetter === l ? "#FFF" : c.textLight,
              }}
            >
              {l}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  chipsScroll: {
    maxHeight: 36,
    marginBottom: 4,
  },
  classChipsScroll: {
    maxHeight: 36,
    marginBottom: 8,
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
