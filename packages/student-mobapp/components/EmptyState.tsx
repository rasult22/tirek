import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui";
import { useThemeColors } from "../lib/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${c.primary}1A` }]}>
        <Ionicons name={icon} size={28} color={c.primary} />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: c.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 13,
            color: c.textLight,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
});
