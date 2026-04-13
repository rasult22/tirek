import { View, StyleSheet } from "react-native";
import { Text } from "../ui";
import { useThemeColors } from "../../lib/theme";

interface Props {
  color: string;
  label: string;
  value: number;
}

export function LegendItem({ color, label, value }: Props) {
  const c = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="small" style={{ color: c.textLight }}>
        {label}
      </Text>
      <Text variant="small" style={{ fontFamily: "DMSans-SemiBold" }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
