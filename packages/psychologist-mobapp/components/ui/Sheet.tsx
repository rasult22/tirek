import { View, type ViewProps } from "react-native";
import { useThemeColors, radius } from "../../lib/theme";

export type SheetVariant = "bottom" | "over-hero";

interface Props extends ViewProps {
  variant?: SheetVariant;
  /** Negative top margin for over-hero variant (overlap hero by N px). */
  overlap?: number;
}

export function Sheet({
  variant = "bottom",
  overlap = 32,
  style,
  children,
  ...props
}: Props) {
  const c = useThemeColors();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: c.surface,
          borderTopLeftRadius: radius["3xl"],
          borderTopRightRadius: radius["3xl"],
          marginTop: variant === "over-hero" ? -overlap : 0,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
