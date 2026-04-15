import { useEffect } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useThemeColors, radius } from "../lib/theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const c = useThemeColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.set(withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: c.surfaceHover,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const c = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderLight }, style]}>
      <View style={styles.cardRow}>
        <Skeleton width={48} height={48} borderRadius={radius.lg} />
        <View style={styles.cardBody}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardBody: {
    flex: 1,
  },
  list: {
    gap: 0,
  },
});
