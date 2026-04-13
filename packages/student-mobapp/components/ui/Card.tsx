import { View, type ViewProps } from "react-native";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

interface Props extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = false, style, children, ...props }: Props) {
  const c = useThemeColors();

  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          backgroundColor: c.surface,
          borderColor: elevated ? c.border : c.borderLight,
        },
        elevated ? shadow(2) : shadow(1),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
