import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useThemeColors, radius, spacing } from "../../lib/theme";

export type EmptyStateVariant =
  | "no-students"
  | "no-crisis"
  | "all-calm"
  | "no-messages"
  | "no-data";

type IconName = keyof typeof Ionicons.glyphMap;

interface VariantConfig {
  icon: IconName;
  /** "neutral" → muted; "positive" → success-tinted (all-calm). */
  tone: "neutral" | "positive";
}

const VARIANTS: Record<EmptyStateVariant, VariantConfig> = {
  "no-students": { icon: "people-outline", tone: "neutral" },
  "no-crisis": { icon: "shield-checkmark-outline", tone: "positive" },
  "all-calm": { icon: "leaf-outline", tone: "positive" },
  "no-messages": { icon: "chatbubble-outline", tone: "neutral" },
  "no-data": { icon: "document-text-outline", tone: "neutral" },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  /** Optional CTA. Brand-tinted, primary action only. */
  actionLabel?: string;
  onAction?: () => void;
  /** Override icon for ad-hoc cases. */
  icon?: IconName;
}

export function EmptyState({
  variant = "no-data",
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const c = useThemeColors();
  const config = VARIANTS[variant];
  const iconColor = config.tone === "positive" ? c.success : c.textLight;
  const iconBg =
    config.tone === "positive" ? `${c.success}14` : c.surfaceSecondary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon ?? config.icon} size={28} color={iconColor} />
      </View>
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="bodyLight" style={styles.desc}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: c.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
            {actionLabel}
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
    paddingVertical: 48,
    paddingHorizontal: spacing["2xl"],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    textAlign: "center",
  },
  desc: {
    marginTop: 6,
    textAlign: "center",
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: 18,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
});
