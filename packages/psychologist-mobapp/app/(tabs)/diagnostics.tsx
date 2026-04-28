import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { CatalogSegment } from "../../components/diagnostics/CatalogSegment";
import { AssignmentsSegment } from "../../components/diagnostics/AssignmentsSegment";
import { ResultsSegment } from "../../components/diagnostics/ResultsSegment";
import { DiagnosticsFiltersSheet } from "../../components/diagnostics/DiagnosticsFiltersSheet";
import type { DiagnosticsFilters } from "../../lib/api/diagnostics";

type Segment = "catalog" | "assignments" | "results";

function isFilterActive(f: DiagnosticsFilters): boolean {
  return Boolean(
    f.testSlug || f.severity || f.grade || f.classLetter || f.from || f.to,
  );
}

export default function DiagnosticsScreen() {
  const t = useT();
  const c = useThemeColors();

  const [segment, setSegment] = useState<Segment>("catalog");
  const [filters, setFilters] = useState<DiagnosticsFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <Text variant="h2">{t.psychologist.diagnostics}</Text>
        {segment === "results" && (
          <Pressable
            onPress={() => {
              hapticLight();
              setFiltersOpen(true);
            }}
            style={({ pressed }) => [
              styles.filterBtn,
              { borderColor: c.borderLight, backgroundColor: c.surface },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="filter-outline" size={14} color={c.text} />
            <Text variant="small" style={{ fontFamily: "DMSans-SemiBold" }}>
              {t.psychologist.filtersTitle}
            </Text>
            {isFilterActive(filters) && (
              <View
                style={[
                  styles.filterBtnDot,
                  { backgroundColor: c.primary },
                ]}
              />
            )}
          </Pressable>
        )}
      </View>

      <View
        style={[
          styles.segmented,
          { backgroundColor: c.surfaceSecondary },
        ]}
      >
        <SegmentBtn
          label={t.psychologist.diagnosticsSegmentCatalog}
          active={segment === "catalog"}
          onPress={() => setSegment("catalog")}
          c={c}
        />
        <SegmentBtn
          label={t.psychologist.diagnosticsSegmentAssignments}
          active={segment === "assignments"}
          onPress={() => setSegment("assignments")}
          c={c}
        />
        <SegmentBtn
          label={t.psychologist.diagnosticsSegmentResults}
          active={segment === "results"}
          onPress={() => setSegment("results")}
          c={c}
        />
      </View>

      <View style={{ flex: 1, marginTop: 8 }}>
        {segment === "catalog" && <CatalogSegment />}
        {segment === "assignments" && <AssignmentsSegment />}
        {segment === "results" && <ResultsSegment filters={filters} />}
      </View>

      <DiagnosticsFiltersSheet
        visible={filtersOpen}
        initial={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

interface SegmentBtnProps {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useThemeColors>;
}

function SegmentBtn({ label, active, onPress, c }: SegmentBtnProps) {
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={[
        styles.segmentBtn,
        active && {
          backgroundColor: c.surface,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 2,
          elevation: 1,
        },
      ]}
    >
      <Text
        variant="small"
        style={{
          fontFamily: "DMSans-SemiBold",
          color: active ? c.text : c.textLight,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    position: "relative",
  },
  filterBtnDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmented: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 4,
    borderRadius: radius.lg,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
