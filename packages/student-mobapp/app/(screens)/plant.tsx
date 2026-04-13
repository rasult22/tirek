import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { useT } from "../../lib/hooks/useLanguage";
import { plantApi } from "../../lib/api/plant";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";

const STAGE_EMOJI = ["\u{1F331}", "\u{1F33F}", "\u{1F333}", "\u{1F338}"] as const;
const STAGE_BG = [
  { from: "rgba(132,204,22,0.15)", to: "rgba(34,197,94,0.08)" },
  { from: "rgba(34,197,94,0.15)", to: "rgba(16,185,129,0.08)" },
  { from: "rgba(16,185,129,0.15)", to: "rgba(20,184,166,0.08)" },
  { from: "rgba(236,72,153,0.15)", to: "rgba(244,63,94,0.08)" },
] as const;

const STAGE_THRESHOLDS = [0, 50, 150, 300];

function stageName(stage: number, t: any) {
  if (stage === 1) return t.sprout;
  if (stage === 2) return t.bush;
  if (stage === 3) return t.tree;
  return t.bloomingTree;
}

export default function PlantScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: plant,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["plant"],
    queryFn: plantApi.get,
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saved, setSaved] = useState(false);

  const renameMutation = useMutation({
    mutationFn: (name: string) => plantApi.rename(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant"] });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text variant="bodyLight" style={{ marginTop: 12 }}>
            {t.common.loading}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stageIdx = plant.stage - 1;
  const emoji = STAGE_EMOJI[stageIdx] ?? "\u{1F338}";
  const progressPercent =
    plant.stage >= 4
      ? 100
      : Math.round(
          ((plant.growthPoints - STAGE_THRESHOLDS[stageIdx]) /
            (plant.nextStageThreshold - STAGE_THRESHOLDS[stageIdx])) *
            100,
        );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Plant illustration */}
        <View
          style={[
            styles.plantHero,
            { backgroundColor: STAGE_BG[stageIdx]?.from ?? STAGE_BG[3].from },
            plant.isSleeping && styles.sleeping,
          ]}
        >
          <Text style={styles.plantEmoji}>{emoji}</Text>
          <Text variant="h2" style={{ marginTop: 12 }}>
            {plant.name ?? t.plant.unnamed}
          </Text>
          <Text variant="bodyLight" style={{ marginTop: 4 }}>
            {stageName(plant.stage, t.plant)}
          </Text>
          {plant.isSleeping && (
            <View style={styles.sleepBadge}>
              <Text style={[styles.sleepText, { color: c.textLight }]}>
                {"\u{1F4A4}"} {t.plant.sleeping}
              </Text>
            </View>
          )}
        </View>

        {/* Name editing */}
        <Card style={styles.nameCard}>
          <Text variant="caption" style={{ marginBottom: 8 }}>
            {t.plant.nameLabel}
          </Text>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.nameInput, { borderColor: c.borderLight, color: c.text, backgroundColor: c.surfaceSecondary }]}
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
                placeholder={t.plant.namePlaceholder}
                placeholderTextColor={c.textLight}
                autoFocus
              />
              <Pressable
                onPress={() => renameMutation.mutate(editName)}
                disabled={!editName.trim() || renameMutation.isPending}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: c.primary },
                  pressed && { opacity: 0.8 },
                  (!editName.trim() || renameMutation.isPending) && {
                    opacity: 0.5,
                  },
                ]}
              >
                {renameMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text variant="body" style={{ fontWeight: "600", flex: 1 }}>
                {plant.name ?? t.plant.unnamed}
              </Text>
              <Pressable
                onPress={() => {
                  setEditName(plant.name ?? "");
                  setEditing(true);
                }}
                style={({ pressed }) => [
                  styles.editBtn,
                  { backgroundColor: c.surfaceSecondary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="pencil" size={14} color={c.textLight} />
              </Pressable>
            </View>
          )}
          {saved && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: c.success,
                marginTop: 6,
              }}
            >
              {"\u2713"} {t.plant.nameSaved}
            </Text>
          )}
        </Card>

        {/* Growth stats */}
        <Card style={styles.growthCard}>
          <Text variant="caption" style={{ marginBottom: 12 }}>
            {t.plant.growthPoints}
          </Text>

          {/* Points and progress */}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsNum}>{plant.growthPoints}</Text>
            {plant.stage < 4 && (
              <Text variant="small">
                {t.plant.pointsToNext}: {plant.pointsToNextStage}
              </Text>
            )}
          </View>

          <View style={[styles.progressOuter, { backgroundColor: c.surfaceSecondary }]}>
            <View
              style={[
                styles.progressInner,
                { width: `${Math.max(progressPercent, 3)}%` },
              ]}
            />
          </View>

          {/* Stage indicators */}
          <View style={styles.stagesRow}>
            {STAGE_EMOJI.map((em, i) => (
              <View
                key={i}
                style={[
                  styles.stageItem,
                  i > stageIdx && { opacity: 0.3 },
                ]}
              >
                <Text style={styles.stageEmoji}>{em}</Text>
                <Text style={[styles.stageName, { color: c.textLight }]}>
                  {i === 0 && t.plant.sprout}
                  {i === 1 && t.plant.bush}
                  {i === 2 && t.plant.tree}
                  {i === 3 && t.plant.bloomingTree}
                </Text>
              </View>
            ))}
          </View>

          {plant.stage >= 4 && (
            <Text style={styles.maxStageText}>
              {"\u{1F389}"} {t.plant.maxStage}
            </Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  plantHero: {
    alignItems: "center",
    borderRadius: radius.xl,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  sleeping: {
    opacity: 0.6,
  },
  plantEmoji: {
    fontSize: 80,
  },
  sleepBadge: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sleepText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Name card
  nameCard: {
    marginTop: 16,
  },
  editRow: {
    flexDirection: "row",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  // Growth card
  growthCard: {
    marginTop: 12,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pointsNum: {
    fontSize: 28,
    fontWeight: "800",
    color: "#16A34A",
  },
  progressOuter: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressInner: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },

  // Stages
  stagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stageItem: {
    alignItems: "center",
    gap: 4,
  },
  stageEmoji: {
    fontSize: 28,
  },
  stageName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  maxStageText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
});
