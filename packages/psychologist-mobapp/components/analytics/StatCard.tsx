import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../ui";
import { Card } from "../ui/Card";
import { useThemeColors, spacing } from "../../lib/theme";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  label: string;
  value: string | number;
  icon: IoniconsName;
  iconBg: string;
  iconColor: string;
}

export function StatCard({ label, value, icon, iconBg, iconColor }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="small" style={styles.label}>
            {label}
          </Text>
          <Text variant="number" style={styles.value}>
            {value}
          </Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
  },
  label: {
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
