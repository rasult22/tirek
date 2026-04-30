import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { testDefinitions, type Severity } from "@tirek/shared";
import { Text, Button } from "../ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { colors as ds } from "@tirek/shared/design-system";
import type { DiagnosticsFilters } from "../../lib/api/diagnostics";

interface Props {
  visible: boolean;
  initial: DiagnosticsFilters;
  onClose: () => void;
  onApply: (filters: DiagnosticsFilters) => void;
}

const SEVERITIES: Severity[] = ["minimal", "mild", "moderate", "severe"];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function DiagnosticsFiltersSheet({
  visible,
  initial,
  onClose,
  onApply,
}: Props) {
  const t = useT();
  const { language } = useLanguage();
  const c = useThemeColors();
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const [testSlug, setTestSlug] = useState<string>(initial.testSlug ?? "");
  const [severity, setSeverity] = useState<string>(
    typeof initial.severity === "string" ? initial.severity : "",
  );
  const [grade, setGrade] = useState<string>(
    initial.grade != null ? String(initial.grade) : "",
  );
  const [from, setFrom] = useState<string>(initial.from ?? "");
  const [to, setTo] = useState<string>(initial.to ?? "");

  useEffect(() => {
    if (visible) {
      setTestSlug(initial.testSlug ?? "");
      setSeverity(typeof initial.severity === "string" ? initial.severity : "");
      setGrade(initial.grade != null ? String(initial.grade) : "");
      setFrom(initial.from ?? "");
      setTo(initial.to ?? "");
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible, initial]);

  const tests = Object.values(testDefinitions);

  function apply() {
    hapticLight();
    onApply({
      testSlug: testSlug || undefined,
      severity: severity || undefined,
      grade: grade ? Number(grade) : undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }

  function reset() {
    setTestSlug("");
    setSeverity("");
    setGrade("");
    setFrom("");
    setTo("");
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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
    >
      <View style={styles.header}>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 24,
            fontFamily: "Inter_700Bold",
            color: c.text,
            flex: 1,
          }}
        >
          {t.psychologist.filtersTitle}
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
        <Section
          title={t.psychologist.filtersTest}
          c={c}
          t={t}
          value={testSlug}
          setValue={setTestSlug}
          options={tests.map((td) => ({
            value: td.slug,
            label: language === "kz" ? td.nameKz : td.nameRu,
          }))}
        />
        <Section
          title={t.psychologist.filtersSeverity}
          c={c}
          t={t}
          value={severity}
          setValue={setSeverity}
          options={SEVERITIES.map((s) => ({ value: s, label: s }))}
        />
        <Section
          title={t.psychologist.filtersGrade}
          c={c}
          t={t}
          value={grade}
          setValue={setGrade}
          options={GRADES.map((g) => ({
            value: String(g),
            label: String(g),
          }))}
        />
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: c.textLight }]}>
              {t.psychologist.filtersDateFrom}
            </Text>
            <BottomSheetTextInput
              value={from}
              onChangeText={setFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textLight}
              maxLength={10}
              style={[
                styles.input,
                {
                  borderColor: c.borderLight,
                  color: c.text,
                  backgroundColor: c.bg,
                },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: c.textLight }]}>
              {t.psychologist.filtersDateTo}
            </Text>
            <BottomSheetTextInput
              value={to}
              onChangeText={setTo}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textLight}
              maxLength={10}
              style={[
                styles.input,
                {
                  borderColor: c.borderLight,
                  color: c.text,
                  backgroundColor: c.bg,
                },
              ]}
            />
          </View>
        </View>
      </BottomSheetScrollView>

      <View style={[styles.footer, { borderTopColor: c.borderLight }]}>
        <Button
          title={t.psychologist.filtersReset}
          variant="secondary"
          size="md"
          onPress={reset}
          style={{ flex: 1 }}
        />
        <Button
          title={t.psychologist.filtersApply}
          variant="primary"
          size="md"
          onPress={apply}
          style={{ flex: 2 }}
        />
      </View>
    </BottomSheetModal>
  );
}

interface SectionProps {
  title: string;
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  value: string;
  setValue: (v: string) => void;
  options: { value: string; label: string }[];
}

function Section({ title, c, t, value, setValue, options }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: c.textLight }]}>{title}</Text>
      <View style={styles.chips}>
        <Chip
          label={t.psychologist.codeAny}
          active={value === ""}
          onPress={() => {
            hapticLight();
            setValue("");
          }}
          c={c}
        />
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Chip
              key={opt.value}
              label={opt.label}
              active={active}
              onPress={() => {
                hapticLight();
                setValue(active ? "" : opt.value);
              }}
              c={c}
            />
          );
        })}
      </View>
    </View>
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
          fontSize: 12,
          fontFamily: "Inter_600SemiBold",
          color: active ? c.primaryDark : c.textLight,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
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
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
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
