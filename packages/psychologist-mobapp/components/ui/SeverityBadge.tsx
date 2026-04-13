import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";

interface SeverityBadgeProps {
  severity: string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const t = useT();
  const c = useThemeColors();

  const labels: Record<string, string> = {
    minimal: t.severity.minimal,
    mild: t.severity.mild,
    moderate: t.severity.moderate,
    severe: t.severity.severe,
  };

  const colorMap: Record<string, { bg: string; text: string }> = {
    minimal: { bg: `${c.success}26`, text: c.success },
    mild: { bg: `${c.warning}26`, text: c.warning },
    moderate: { bg: "#FFF3E0", text: "#E65100" },
    severe: { bg: `${c.danger}26`, text: c.danger },
  };

  const colors = colorMap[severity] ?? colorMap.minimal;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {labels[severity] ?? severity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
