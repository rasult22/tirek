import { View, type AccessibilityProps } from "react-native";
import { radius, colors as ds } from "@tirek/shared/design-system";
import { useThemeColors } from "../../lib/theme";

export type MoodValue = 1 | 2 | 3 | 4 | 5;

interface Props extends AccessibilityProps {
  value: MoodValue;
}

const SEGMENTS = 5;
const SEGMENT_WIDTH = 6;
const SEGMENT_HEIGHT = 10;
const SEGMENT_GAP = 2;

export function MoodScale({ value, accessibilityLabel, ...props }: Props) {
  const c = useThemeColors();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Настроение ${value} из ${SEGMENTS}`}
      style={{
        flexDirection: "row",
        gap: SEGMENT_GAP,
        alignItems: "center",
      }}
      {...props}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <View
          key={i}
          style={{
            width: SEGMENT_WIDTH,
            height: SEGMENT_HEIGHT,
            borderRadius: radius.xs,
            backgroundColor: i < value ? c.primary : ds.hairline,
          }}
        />
      ))}
    </View>
  );
}
