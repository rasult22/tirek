import { useEffect, useState } from "react";
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { testDefinitions, type Severity } from "@tirek/shared";
import { Text, Button } from "../ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: c.surface }]}>
          <View style={styles.dragHandle}>
            <View style={[styles.dragBar, { backgroundColor: c.border }]} />
          </View>
          <View style={styles.header}>
            <Text variant="h3" style={{ fontWeight: "700" }}>
              {t.psychologist.filtersTitle}
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: c.surfaceSecondary }]}
            >
              <Ionicons name="close" size={16} color={c.textLight} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
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
                <Text variant="caption" style={styles.label}>
                  {t.psychologist.filtersDateFrom}
                </Text>
                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.textLight}
                  maxLength={10}
                  style={[
                    styles.input,
                    { borderColor: c.borderLight, color: c.text },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" style={styles.label}>
                  {t.psychologist.filtersDateTo}
                </Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.textLight}
                  maxLength={10}
                  style={[
                    styles.input,
                    { borderColor: c.borderLight, color: c.text },
                  ]}
                />
              </View>
            </View>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button
                  title={t.psychologist.filtersReset}
                  variant="secondary"
                  size="md"
                  onPress={reset}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Button
                  title={t.psychologist.filtersApply}
                  variant="primary"
                  size="md"
                  onPress={apply}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
      <Text variant="caption" style={styles.label}>
        {title}
      </Text>
      <View style={styles.chips}>
        <Pressable
          onPress={() => {
            hapticLight();
            setValue("");
          }}
          style={[
            styles.chip,
            value === ""
              ? { backgroundColor: c.primary }
              : { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <Text
            variant="small"
            style={{
              fontWeight: "600",
              color: value === "" ? "#FFF" : c.textLight,
            }}
          >
            {t.psychologist.codeAny}
          </Text>
        </Pressable>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                hapticLight();
                setValue(active ? "" : opt.value);
              }}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: c.primary }
                  : { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Text
                variant="small"
                style={{
                  fontWeight: "600",
                  color: active ? "#FFF" : c.textLight,
                }}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  dragHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
});
