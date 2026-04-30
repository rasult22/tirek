import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Button } from "../ui";
import { useThemeColors, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { colors as ds } from "@tirek/shared/design-system";

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
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["55%", "85%"], []);

  const [draftGrade, setDraftGrade] = useState<number | null>(grade);
  const [draftLetter, setDraftLetter] = useState<string | null>(classLetter);

  useEffect(() => {
    if (open) {
      setDraftGrade(grade);
      setDraftLetter(classLetter);
      ref.current?.present();
    } else {
      ref.current?.dismiss();
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
      handleIndicatorStyle={{ backgroundColor: c.borderLight }}
      enablePanDownToClose
    >
      <View style={styles.headerRow}>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 24,
            fontFamily: "Inter_700Bold",
            color: c.text,
            flex: 1,
          }}
        >
          {t.common.filters}
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: c.surfaceSecondary },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={18} color={c.textLight} />
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: c.textLight }]}>
          {t.psychologist.studentClass}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={t.psychologist.allGrades}
            active={draftGrade === null}
            onPress={() => {
              hapticLight();
              setDraftGrade(null);
            }}
            c={c}
          />
          {GRADES.map((g) => (
            <Chip
              key={g}
              label={String(g)}
              active={draftGrade === g}
              onPress={() => {
                hapticLight();
                setDraftGrade(draftGrade === g ? null : g);
              }}
              c={c}
            />
          ))}
        </ScrollView>

        <Text
          style={[
            styles.sectionLabel,
            { color: c.textLight, marginTop: spacing.lg },
          ]}
        >
          {t.psychologist.classLetterLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={t.psychologist.allClasses}
            active={draftLetter === null}
            onPress={() => {
              hapticLight();
              setDraftLetter(null);
            }}
            c={c}
          />
          {CLASS_LETTERS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={draftLetter === l}
              onPress={() => {
                hapticLight();
                setDraftLetter(draftLetter === l ? null : l);
              }}
              c={c}
            />
          ))}
        </ScrollView>
      </BottomSheetScrollView>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
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
    </BottomSheetModal>
  );
}

function Chip({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: ds.brandSoft, borderColor: `${c.primary}33` }
          : { backgroundColor: c.surfaceSecondary, borderColor: c.borderLight },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Inter_600SemiBold",
          color: active ? c.primaryDark : c.textLight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
});
