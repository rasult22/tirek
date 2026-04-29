import { View, type ViewProps, type TextStyle } from "react-native";
import { Text } from "./Text";
import { radius, fontSize, fontWeight } from "@tirek/shared/design-system";
import { useThemeColors } from "../../lib/theme";
import { colors as ds } from "@tirek/shared/design-system";

export type PillVariant = "brand" | "success" | "warning" | "danger";

interface Props extends ViewProps {
  label: string;
  variant?: PillVariant;
}

export function Pill({ label, variant = "brand", style, ...props }: Props) {
  const c = useThemeColors();

  const palette: Record<PillVariant, { bg: string; fg: string }> = {
    brand: { bg: ds.brandSoft, fg: c.primary },
    success: { bg: ds.successSoft, fg: c.success },
    warning: { bg: ds.warningSoft, fg: c.warning },
    danger: { bg: ds.dangerSoft, fg: c.danger },
  };

  const tone = palette[variant];

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: tone.bg,
          borderRadius: radius.pill,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          color: tone.fg,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.bold as TextStyle["fontWeight"],
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
