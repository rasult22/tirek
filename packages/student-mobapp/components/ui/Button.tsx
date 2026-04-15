import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useThemeColors, radius, type ThemeColors } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function getVariantStyles(c: ThemeColors): Record<Variant, ViewStyle> {
  return {
    primary: { backgroundColor: c.primary, ...shadow(2) },
    secondary: {
      backgroundColor: c.surfaceSecondary,
      borderWidth: 1,
      borderColor: c.border,
    },
    danger: { backgroundColor: c.danger, ...shadow(2) },
    ghost: { backgroundColor: "transparent" },
  };
}

function getVariantTextStyles(c: ThemeColors): Record<Variant, TextStyle> {
  return {
    primary: { color: "#FFFFFF" },
    secondary: { color: c.text },
    danger: { color: "#FFFFFF" },
    ghost: { color: c.primary },
  };
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: Props) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => { hapticLight(); onPress(); }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        getVariantStyles(c)[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#FFFFFF" : c.primary}
        />
      ) : (
        <Text style={[styles.text, getVariantTextStyles(c)[variant]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
});
