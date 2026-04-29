import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  type ViewStyle,
  type TextStyle,
  type PressableStateCallbackType,
} from "react-native";
import {
  colors,
  radius,
  control,
  fontSize,
  fontWeight,
} from "@tirek/shared/design-system";
import { hapticLight } from "../../lib/haptics";

export type ButtonVariant = "primary" | "ghost" | "on-dark" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.brand,
    ...Platform.select({
      ios: {
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  ghost: {
    backgroundColor: "transparent",
  },
  "on-dark": {
    backgroundColor: colors.onDark,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  danger: {
    backgroundColor: colors.danger,
    ...Platform.select({
      ios: {
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.brandFg },
  ghost: { color: colors.brand },
  "on-dark": { color: colors.inkDark },
  secondary: { color: colors.ink },
  danger: { color: colors.brandFg },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: control.height.sm, paddingHorizontal: 16, borderRadius: radius.md },
  md: { height: control.height.md, paddingHorizontal: 18, borderRadius: radius.lg },
  lg: { height: control.height.lg, paddingHorizontal: 20, borderRadius: radius.xl },
  xl: { height: control.height.xl, paddingHorizontal: 24, borderRadius: radius.xl },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.md },
  xl: { fontSize: fontSize.lg },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={isDisabled}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantTextStyles[variant].color as string}
        />
      ) : (
        <Text style={[styles.text, sizeTextStyles[size], variantTextStyles[variant], textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontWeight: fontWeight.bold as TextStyle["fontWeight"],
    letterSpacing: 0.2,
  },
});
