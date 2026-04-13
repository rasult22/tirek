import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";

interface StatusBadgeProps {
  status: "normal" | "attention" | "crisis";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const t = useT();
  const c = useThemeColors();

  const labels: Record<string, string> = {
    normal: t.psychologist.statusNormal,
    attention: t.psychologist.statusAttention,
    crisis: t.psychologist.statusCrisis,
  };

  const colorMap: Record<string, string> = {
    normal: c.success,
    attention: c.warning,
    crisis: c.danger,
  };

  const color = colorMap[status] ?? c.success;
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}26` },
        isSmall ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          { color },
          isSmall && styles.textSm,
        ]}
      >
        {labels[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 11,
  },
});
