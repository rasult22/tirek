import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./index";
import type { AssignedTest } from "@tirek/shared";

interface StatusBadgeProps {
  assignment: AssignedTest;
}

const STATUS_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string; label: string }
> = {
  completed: {
    icon: "checkmark-circle",
    bg: "#ECFDF5",
    color: "#047857",
    label: "Пройдено",
  },
  overdue: {
    icon: "warning",
    bg: "#FEF2F2",
    color: "#B91C1C",
    label: "Просрочено",
  },
  in_progress: {
    icon: "time",
    bg: "#FFFBEB",
    color: "#B45309",
    label: "Не завершено",
  },
  new: {
    icon: "sparkles",
    bg: "#EFF6FF",
    color: "#1D4ED8",
    label: "Новое",
  },
};

function getStatusKey(assignment: AssignedTest): string {
  if (assignment.status === "completed") return "completed";
  if (assignment.overdue) return "overdue";
  if (assignment.status === "in_progress") return "in_progress";
  return "new";
}

export function StatusBadge({ assignment }: StatusBadgeProps) {
  const key = getStatusKey(assignment);
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.new;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={11} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
