import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeColors } from "../lib/theme";

interface LoadingProps {
  size?: "small" | "large";
}

export function Loading({ size = "large" }: LoadingProps) {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ActivityIndicator size={size} color={c.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
