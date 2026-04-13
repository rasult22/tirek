import { useState } from "react";
import { View, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { Text } from "../ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";

interface ActionMenuProps {
  onExportCSV: () => void;
  onDetach: () => void;
}

export function ActionMenu({ onExportCSV, onDetach }: ActionMenuProps) {
  const t = useT();
  const c = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          hapticLight();
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: c.inputBorder,
            backgroundColor: pressed ? c.surfaceHover : c.surface,
          },
        ]}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={c.textLight} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              { backgroundColor: c.surface, borderColor: c.border },
              shadow(2),
            ]}
          >
            <Pressable
              onPress={() => {
                onExportCSV();
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: c.surfaceHover },
              ]}
            >
              <Ionicons
                name="download-outline"
                size={16}
                color={c.textLight}
              />
              <Text variant="body">
                {t.psychologist.studentDetail.exportCSV}
              </Text>
            </Pressable>

            <View style={[styles.divider, { borderColor: c.borderLight }]} />

            <Pressable
              onPress={() => {
                onDetach();
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: `${c.danger}08` },
              ]}
            >
              <Ionicons name="person-remove-outline" size={16} color={c.danger} />
              <Text variant="body" style={{ color: c.danger }}>
                {t.psychologist.detachStudent}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menu: {
    width: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: spacing.sm,
  },
});
