import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { useThemeColors, spacing, radius } from "../../lib/theme";

interface DayDividerProps {
  /** Pre-formatted label, e.g. "Сегодня", "27 апреля". */
  label: string;
  /** Indent vertically. Defaults to "lg" (16). */
  marginY?: keyof typeof spacing;
}

export function DayDivider({ label, marginY = "lg" }: DayDividerProps) {
  const c = useThemeColors();
  return (
    <View style={[styles.row, { marginVertical: spacing[marginY] }]}>
      <View style={[styles.line, { backgroundColor: c.borderLight }]} />
      <View
        style={[
          styles.chip,
          {
            backgroundColor: c.surfaceSecondary,
            borderColor: c.borderLight,
          },
        ]}
      >
        <Text variant="small" style={{ color: c.textLight, fontWeight: "600" }}>
          {label}
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: c.borderLight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
