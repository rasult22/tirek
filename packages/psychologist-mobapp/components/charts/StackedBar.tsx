import { View, StyleSheet } from "react-native";
import { useThemeColors, radius } from "../../lib/theme";

export interface BarSegment {
  value: number;
  color: string;
}

interface Props {
  segments: BarSegment[];
  height?: number;
  borderRadius?: number;
}

export function StackedBar({
  segments,
  height = 20,
  borderRadius = 10,
}: Props) {
  const c = useThemeColors();
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius, backgroundColor: c.surfaceSecondary },
      ]}
    >
      {total > 0 &&
        segments.map((seg, i) =>
          seg.value > 0 ? (
            <View
              key={i}
              style={{ flex: seg.value, backgroundColor: seg.color }}
            />
          ) : null,
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    overflow: "hidden",
    width: "100%",
  },
});
