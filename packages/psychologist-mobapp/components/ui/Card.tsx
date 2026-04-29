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

function floatingShadow(): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation: dsShadow.md.elevation };
  }
  return {
    shadowColor: dsShadow.md.color,
    shadowOffset: dsShadow.md.offset,
    shadowOpacity: dsShadow.md.opacity,
    shadowRadius: dsShadow.md.radius,
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
        resolved === "floating" ? floatingShadow() : shadowFn(1),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
