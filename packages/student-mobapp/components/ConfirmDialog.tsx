import { View, Modal, Pressable, StyleSheet } from "react-native";
import { Text, Button } from "./ui";
import { useT } from "../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../lib/theme";

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
          <Text variant="h3">{title ?? t.common.confirmDelete}</Text>
          <Text variant="bodyLight" style={styles.desc}>
            {description ?? t.common.confirmDeleteDescription}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: c.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: c.text }}>
                {t.common.cancel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor:
                    variant === "danger" ? c.danger : c.primary,
                },
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
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.lg,
    padding: 24,
  },
  desc: {
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
