import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../components/ui";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SkeletonList } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { useT, useLanguage } from "../../../lib/hooks/useLanguage";
import { useRefresh } from "../../../lib/hooks/useRefresh";
import { testsApi } from "../../../lib/api/tests";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";
import { hapticLight } from "../../../lib/haptics";
import type { AssignedTest, DiagnosticTest } from "@tirek/shared";

export default function TestsListScreen() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const [showOthers, setShowOthers] = useState(false);

  const { data: allTests, isLoading: testsLoading } = useQuery({
    queryKey: ["tests"],
    queryFn: testsApi.list,
  });

  const { data: assigned, isLoading: assignedLoading } = useQuery({
    queryKey: ["tests", "assigned"],
    queryFn: testsApi.assigned,
  });

  const isLoading = testsLoading || assignedLoading;

  const assignedSlugs = new Set((assigned ?? []).map((a) => a.test.slug));
  const otherTests = (allTests ?? []).filter(
    (t) => !assignedSlugs.has(t.slug),
  );

  function formatDueDate(dateStr?: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }

  function getCtaLabel(a: AssignedTest) {
    if (a.status === "completed") return "Посмотреть результат";
    if (a.status === "in_progress") return "Продолжить";
    return "Пройти";
  }

  function handleAssignedPress(a: AssignedTest) {
    hapticLight();
    if (a.status === "completed" && a.completedSessionId) {
      push(`/(screens)/tests/results/${a.completedSessionId}` as any);
    } else {
      push({
        pathname: "/(screens)/tests/[testId]" as any,
        params: { testId: a.test.slug },
      });
    }
  }

  function handleTestPress(test: DiagnosticTest) {
    hapticLight();
    push({
      pathname: "/(screens)/tests/[testId]" as any,
      params: { testId: test.slug },
    });
  }

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tests"] }),
      queryClient.invalidateQueries({ queryKey: ["tests", "assigned"] }),
    ]);
  });

  function getBorderColor(a: AssignedTest) {
    if (a.overdue) return "#EF4444";
    if (a.status === "completed") return "#10B981";
    return c.borderLight;
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          {isLoading ? (
            <SkeletonList count={5} />
          ) : (
            <>
              {/* ── ASSIGNED TESTS ── */}
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Назначенные психологом
              </Text>
              {(assigned ?? []).length === 0 ? (
                <View
                  style={[
                    styles.emptyAssigned,
                    { borderColor: c.borderLight },
                  ]}
                >
                  <Ionicons
                    name="clipboard-outline"
                    size={24}
                    color={c.textLight}
                  />
                  <Text style={{ fontSize: 13, color: c.textLight }}>
                    Нет назначенных тестов
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {(assigned ?? []).map((a) => (
                    <Pressable
                      key={a.assignmentId}
                      onPress={() => handleAssignedPress(a)}
                      style={({ pressed }) => [
                        styles.assignedCard,
                        {
                          backgroundColor: c.surface,
                          borderLeftColor: getBorderColor(a),
                          borderColor: c.borderLight,
                        },
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View style={styles.assignedHeader}>
                        <Text
                          style={{
                            fontSize: 24,
                            marginRight: 4,
                          }}
                        >
                          {a.test.emoji ?? "📝"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: c.text,
                            }}
                            numberOfLines={1}
                          >
                            {language === "kz" && a.test.nameKz
                              ? a.test.nameKz
                              : a.test.nameRu ?? a.test.slug}
                          </Text>
                          <StatusBadge assignment={a} />
                        </View>
                      </View>
                      {a.test.description && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: c.textLight,
                            marginTop: 4,
                          }}
                          numberOfLines={2}
                        >
                          {a.test.description}
                        </Text>
                      )}
                      <View style={styles.assignedFooter}>
                        {a.dueDate && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: a.overdue ? "#EF4444" : c.textLight,
                              fontWeight: a.overdue ? "700" : "400",
                            }}
                          >
                            Срок: {formatDueDate(a.dueDate)}
                          </Text>
                        )}
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: c.primary,
                            marginLeft: "auto",
                          }}
                        >
                          {getCtaLabel(a)} →
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* ── OTHER TESTS ── */}
              {otherTests.length > 0 && (
                <>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      setShowOthers(!showOthers);
                    }}
                    style={styles.othersToggle}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: c.text,
                      }}
                    >
                      Другие тесты ({otherTests.length})
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={c.textLight}
                      style={{
                        transform: [
                          { rotate: showOthers ? "180deg" : "0deg" },
                        ],
                      }}
                    />
                  </Pressable>
                  {showOthers && (
                    <View style={styles.cardList}>
                      {otherTests.map((test) => (
                        <Pressable
                          key={test.id}
                          onPress={() => handleTestPress(test)}
                          style={({ pressed }) => [
                            styles.testCard,
                            {
                              backgroundColor: c.surface,
                              borderColor: c.borderLight,
                            },
                            pressed && {
                              opacity: 0.9,
                              transform: [{ scale: 0.98 }],
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 24 }}>
                            {test.emoji ?? "📝"}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: c.text,
                              }}
                              numberOfLines={1}
                            >
                              {language === "kz" && test.nameKz
                                ? test.nameKz
                                : test.nameRu ?? test.slug}
                            </Text>
                            {test.description && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: c.textLight,
                                  marginTop: 2,
                                }}
                                numberOfLines={2}
                              >
                                {test.description}
                              </Text>
                            )}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={c.textLight}
                          />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  cardList: { gap: 10 },
  emptyAssigned: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
  },
  assignedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    ...shadow(1),
  },
  assignedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignedFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  othersToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 16,
  },
  testCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...shadow(1),
  },
});
