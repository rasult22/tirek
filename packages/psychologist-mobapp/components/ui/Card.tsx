import { View, Platform, type ViewProps, type ViewStyle } from "react-native";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow as shadowFn } from "../../lib/theme/shadows";
import { shadow as dsShadow } from "@tirek/shared/design-system";

export type CardVariant = "default" | "floating";

interface Props extends ViewProps {
  variant?: CardVariant;
  /** @deprecated Use variant="floating" instead. */
  elevated?: boolean;
}

function ctaShadow(): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation: dsShadow.cta.elevation };
  }
  return {
    shadowColor: dsShadow.cta.color,
    shadowOffset: dsShadow.cta.offset,
    shadowOpacity: dsShadow.cta.opacity,
    shadowRadius: dsShadow.cta.radius,
  };
}

export function Card({ variant, elevated, style, children, ...props }: Props) {
  const c = useThemeColors();
  const resolved: CardVariant = variant ?? (elevated ? "floating" : "default");

  return (
    <View
      style={[
        {
          borderRadius: radius.md,
          padding: spacing.lg,
          borderWidth: 1,
          backgroundColor: c.surface,
          borderColor: resolved === "floating" ? c.border : c.borderLight,
        },
        resolved === "floating" ? ctaShadow() : shadowFn(1),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
