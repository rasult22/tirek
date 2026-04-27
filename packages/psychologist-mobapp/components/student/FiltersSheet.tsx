import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Button } from "../ui";
import { useThemeColors, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

interface FiltersSheetProps {
  open: boolean;
  grade: number | null;
  classLetter: string | null;
  onClose: () => void;
  onApply: (next: { grade: number | null; classLetter: string | null }) => void;
}

export function FiltersSheet({
  open,
  grade,
  classLetter,
  onClose,
  onApply,
}: FiltersSheetProps) {
  const t = useT();
  const c = useThemeColors();

  const [draftGrade, setDraftGrade] = useState<number | null>(grade);
  const [draftLetter, setDraftLetter] = useState<string | null>(classLetter);

  useEffect(() => {
    if (open) {
      setDraftGrade(grade);
      setDraftLetter(classLetter);
    }
  }, [open, grade, classLetter]);

  function handleApply() {
    onApply({ grade: draftGrade, classLetter: draftLetter });
    onClose();
  }

  function handleReset() {
    setDraftGrade(null);
    setDraftLetter(null);
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: c.borderLight }]} />
          </View>

          <View style={styles.headerRow}>
            <Text variant="h3">{t.common.filters}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={c.textLight} />
            </Pressable>
          </View>

          <Text variant="caption" style={styles.sectionLabel}>
            {t.psychologist.studentClass}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <Pressable
              onPress={() => {
                hapticLight();
                setDraftGrade(null);
              }}
              style={[
                styles.chip,
                draftGrade === null
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: draftGrade === null ? "#FFF" : c.textLight,
                }}
              >
                {t.psychologist.allGrades}
              </Text>
            </Pressable>
            {GRADES.map((g) => (
              <Pressable
                key={g}
                onPress={() => {
                  hapticLight();
                  setDraftGrade(draftGrade === g ? null : g);
                }}
                style={[
                  styles.chip,
                  draftGrade === g
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: c.surfaceSecondary },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    color: draftGrade === g ? "#FFF" : c.textLight,
                  }}
                >
                  {g}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text variant="caption" style={styles.sectionLabel}>
            {t.psychologist.classLetterLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <Pressable
              onPress={() => {
                hapticLight();
                setDraftLetter(null);
              }}
              style={[
                styles.chip,
                draftLetter === null
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontFamily: "DMSans-SemiBold",
                  color: draftLetter === null ? "#FFF" : c.textLight,
                }}
              >
                {t.psychologist.allClasses}
              </Text>
            </Pressable>
            {CLASS_LETTERS.map((l) => (
              <Pressable
                key={l}
                onPress={() => {
                  hapticLight();
                  setDraftLetter(draftLetter === l ? null : l);
                }}
                style={[
                  styles.chip,
                  draftLetter === l
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: c.surfaceSecondary },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    color: draftLetter === l ? "#FFF" : c.textLight,
                  }}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={t.common.reset}
              variant="secondary"
              onPress={handleReset}
              style={{ flex: 1 }}
            />
            <Button
              title={t.common.apply}
              variant="primary"
              onPress={handleApply}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  chipsRow: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
});
