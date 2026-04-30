import { ScrollView, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { spacing } from "../../lib/theme";

interface HorizontalScrollListProps {
  children: ReactNode;
  /** Horizontal padding mirrors screen edges. Defaults to "lg" (16). */
  padX?: keyof typeof spacing;
  /** Gap between items. Defaults to "md" (12). */
  gap?: keyof typeof spacing;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function HorizontalScrollList({
  children,
  padX = "lg",
  gap = "md",
  contentContainerStyle,
  style,
}: HorizontalScrollListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[
        {
          paddingHorizontal: spacing[padX],
          gap: spacing[gap],
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}
