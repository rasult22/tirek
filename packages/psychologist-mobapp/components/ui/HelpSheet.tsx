import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { H3, Body } from "./Typography";
import { useThemeColors, radius, spacing } from "../../lib/theme";

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
  style,
}: HelpSheetProps) {
  const c = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close help"
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.surface },
          style,
        ]}
      >
        <View style={styles.handle}>
          <View style={[styles.handleBar, { backgroundColor: c.border }]} />
        </View>

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

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {description && (
            <Body style={{ lineHeight: 22 }}>{description}</Body>
          )}
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    maxHeight: "85%",
    paddingBottom: spacing["3xl"],
  },
  handle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
    paddingBottom: spacing.xl,
  },
});
