import { View, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui";
import { useT } from "../lib/hooks/useLanguage";
import { useThemeColors, radius, spacing } from "../lib/theme";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  variant = "danger",
}: ConfirmDialogProps) {
  const t = useT();
  const c = useThemeColors();

  const isDanger = variant === "danger";
  const accent = isDanger ? c.danger : c.primary;
  const accentSoft = isDanger ? `${c.danger}1A` : `${c.primary}1A`;
  const icon: keyof typeof Ionicons.glyphMap = isDanger
    ? "alert-circle-outline"
    : "help-circle-outline";

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={[styles.dialog, { backgroundColor: c.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
            <Ionicons name={icon} size={24} color={accent} />
          </View>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 24,
              fontFamily: "Inter_700Bold",
              color: c.text,
              textAlign: "center",
              marginTop: spacing.md,
            }}
          >
            {title ?? t.common.confirmDelete}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: c.textLight,
              textAlign: "center",
              marginTop: 6,
            }}
          >
            {description ?? t.common.confirmDeleteDescription}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: c.borderLight },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_600SemiBold",
                  color: c.text,
                }}
              >
                {t.common.cancel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.confirmText}>
                {confirmLabel ?? t.common.delete}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
