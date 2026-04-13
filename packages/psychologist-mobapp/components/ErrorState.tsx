import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui";
import { useT } from "../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../lib/theme";

interface ErrorStateProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({ onRetry, title, description }: ErrorStateProps) {
  const t = useT();
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${c.danger}18` },
        ]}
      >
        <Ionicons name="warning" size={32} color={c.danger} />
      </View>
      <Text variant="h3" style={styles.title}>
        {title ?? t.common.errorTitle}
      </Text>
      <Text variant="bodyLight" style={styles.desc}>
        {description ?? t.common.errorDescription}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: `${c.primary}14` },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="refresh" size={16} color={c.primary} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: c.primary }}>
            {t.common.retry}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 16,
  },
  desc: {
    marginTop: 6,
    textAlign: "center",
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
