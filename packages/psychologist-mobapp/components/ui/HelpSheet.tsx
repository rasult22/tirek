import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View, type ViewProps } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { H3, Body } from "./Typography";
import { useThemeColors, spacing } from "../../lib/theme";

interface HelpSheetProps extends ViewProps {
  visible: boolean;
  title: string;
  /** Optional richer body. If only string is needed pass `description`. */
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Bottom-sheet for explanatory help (test descriptions, "how does X work").
 * Distinct from `<Sheet>` (layout primitive) — this one is a self-contained
 * modal you summon from "?"-style buttons.
 */
export function HelpSheet({
  visible,
  title,
  description,
  onClose,
  children,
}: HelpSheetProps) {
  const c = useThemeColors();
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "85%"], []);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      index={0}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
      enablePanDownToClose
    >
      <View style={styles.header}>
        <H3 style={{ flex: 1 }}>{title}</H3>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: c.surfaceSecondary },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={18} color={c.textLight} />
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {description && <Body style={{ lineHeight: 22 }}>{description}</Body>}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingBottom: spacing["3xl"],
  },
});
