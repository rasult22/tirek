import { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testDefinitions } from "@tirek/shared";
import { Text } from "../ui";
import { SkeletonList } from "../Skeleton";
import {
  diagnosticsApi,
  type TestAssignmentRow,
  type TestAssignmentStatus,
} from "../../lib/api/diagnostics";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius, type ThemeColors } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

const STATUSES: TestAssignmentStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
];

function statusKey(s: TestAssignmentStatus) {
  switch (s) {
    case "pending":
      return "assignmentStatusPending" as const;
    case "in_progress":
      return "assignmentStatusInProgress" as const;
    case "completed":
      return "assignmentStatusCompleted" as const;
    case "expired":
      return "assignmentStatusExpired" as const;
    case "cancelled":
      return "assignmentStatusCancelled" as const;
  }
}

function statusColors(s: TestAssignmentStatus, c: ThemeColors) {
  switch (s) {
    case "pending":
      return { bg: `${c.warning}1A`, fg: c.warning, border: `${c.warning}33` };
    case "in_progress":
      return { bg: `${c.primary}1A`, fg: c.primary, border: `${c.primary}33` };
    case "completed":
      return { bg: `${c.success}1A`, fg: c.success, border: `${c.success}33` };
    case "expired":
      return { bg: c.surfaceSecondary, fg: c.textLight, border: c.borderLight };
    case "cancelled":
      return { bg: c.surfaceSecondary, fg: c.textLight, border: c.borderLight };
  }
}

export function AssignmentsSegment() {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TestAssignmentStatus | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["diagnostics", "assignments", { status: statusFilter }],
    queryFn: () =>
      diagnosticsApi.listAssignments(
        statusFilter ? { status: statusFilter } : undefined,
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => diagnosticsApi.cancelAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnostics", "assignments"],
      });
    },
  });

  function testNameForRow(row: TestAssignmentRow): string {
    const slug = row.testSlug;
    if (slug && slug in testDefinitions) {
      const td = testDefinitions[slug as keyof typeof testDefinitions];
      return language === "kz" ? td.nameKz : td.nameRu;
    }
    return row.testName ?? row.testId;
  }

  function targetLabel(row: TestAssignmentRow): string {
    if (row.targetType === "student") return row.studentName ?? "—";
    return `${row.targetGrade ?? "?"}${row.targetClassLetter ?? ""}`;
  }

  function handleCancel(row: TestAssignmentRow) {
    Alert.alert(
      t.psychologist.cancelAssignment,
      t.psychologist.cancelAssignmentConfirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.psychologist.cancelAssignment,
          style: "destructive",
          onPress: () => {
            hapticLight();
            cancelMutation.mutate(row.id);
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsScroll}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            setStatusFilter(null);
          }}
          style={[
            styles.chip,
            statusFilter === null
              ? { backgroundColor: c.primary }
              : { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <Text
            variant="small"
            style={{
              fontWeight: "600",
              color: statusFilter === null ? "#FFF" : c.textLight,
            }}
          >
            {t.psychologist.codeAny}
          </Text>
        </Pressable>
        {STATUSES.map((s) => {
          const active = statusFilter === s;
          return (
            <Pressable
              key={s}
              onPress={() => {
                hapticLight();
                setStatusFilter(active ? null : s);
              }}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontWeight: "600",
                  color: active ? "#FFF" : c.textLight,
                }}
              >
                {t.psychologist[statusKey(s)]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : !data || data.length === 0 ? (
        <View style={styles.empty}>
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
          <Text variant="bodyLight">{t.psychologist.assignmentsEmpty}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {data.map((row) => {
            const canCancel =
              row.status === "pending" || row.status === "in_progress";
            const sc = statusColors(row.status, c);
            return (
              <View
                key={row.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.borderLight,
                  },
                  shadow(1),
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text
                      variant="body"
                      style={{
                        fontWeight: "600",
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      {targetLabel(row)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: sc.bg,
                          borderColor: sc.border,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: sc.fg,
                          fontSize: 10,
                          textDecorationLine:
                            row.status === "cancelled"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {t.psychologist[statusKey(row.status)]}
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={{ marginTop: 2 }}
                  >
                    {testNameForRow(row)}
                  </Text>
                  {row.dueDate && (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color={c.textLight}
                      />
                      <Text variant="caption">
                        {t.psychologist.assignmentDueDate}:{" "}
                        {new Date(row.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {row.studentMessage && (
                    <View
                      style={[
                        styles.messageBubble,
                        { backgroundColor: c.surfaceSecondary },
                      ]}
                    >
                      <Text variant="caption">"{row.studentMessage}"</Text>
                    </View>
                  )}
                </View>
                {canCancel && (
                  <Pressable
                    onPress={() => handleCancel(row)}
                    disabled={cancelMutation.isPending}
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      { borderColor: c.borderLight },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={{ fontWeight: "600" }}
                    >
                      {t.psychologist.cancelAssignment}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  messageBubble: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
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
});
