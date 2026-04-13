import { View, Text, StyleSheet } from "react-native";
import { useThemeColors } from "../../lib/theme";

interface Props {
  count: number;
  variant?: "danger" | "primary";
}

export function Badge({ count, variant = "danger" }: Props) {
  const c = useThemeColors();

  if (count <= 0) return null;

  const bg = variant === "danger" ? c.danger : c.primary;
  const label = count > 99 ? "99+" : String(count);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
