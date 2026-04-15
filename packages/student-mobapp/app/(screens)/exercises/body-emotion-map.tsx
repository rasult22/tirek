import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { useT } from "../../../lib/hooks/useLanguage";
import { cbtApi } from "../../../lib/api/cbt";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useThemeColors, radius } from "../../../lib/theme";
import { shadow } from "../../../lib/theme/shadows";

interface BodyRegion {
  id: string;
  labelKey: string;
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

const BODY_REGIONS: BodyRegion[] = [
  { id: "head", labelKey: "head", top: 0, left: 115, width: 50, height: 50, borderRadius: 25 },
  { id: "throat", labelKey: "throat", top: 52, left: 125, width: 30, height: 22, borderRadius: 11 },
  { id: "left_shoulder", labelKey: "leftShoulder", top: 60, left: 72, width: 48, height: 30, borderRadius: 12 },
  { id: "right_shoulder", labelKey: "rightShoulder", top: 60, left: 160, width: 48, height: 30, borderRadius: 12 },
  { id: "chest", labelKey: "chest", top: 80, left: 105, width: 70, height: 50, borderRadius: 16 },
  { id: "left_arm", labelKey: "leftArm", top: 95, left: 52, width: 35, height: 70, borderRadius: 14 },
  { id: "right_arm", labelKey: "rightArm", top: 95, left: 193, width: 35, height: 70, borderRadius: 14 },
  { id: "stomach", labelKey: "stomach", top: 135, left: 105, width: 70, height: 50, borderRadius: 16 },
  { id: "left_hand", labelKey: "leftHand", top: 170, left: 40, width: 30, height: 30, borderRadius: 15 },
  { id: "right_hand", labelKey: "rightHand", top: 170, left: 210, width: 30, height: 30, borderRadius: 15 },
  { id: "hips", labelKey: "hips", top: 190, left: 100, width: 80, height: 35, borderRadius: 14 },
  { id: "left_leg", labelKey: "leftLeg", top: 230, left: 100, width: 36, height: 90, borderRadius: 14 },
  { id: "right_leg", labelKey: "rightLeg", top: 230, left: 144, width: 36, height: 90, borderRadius: 14 },
  { id: "left_foot", labelKey: "leftFoot", top: 325, left: 95, width: 36, height: 25, borderRadius: 12 },
  { id: "right_foot", labelKey: "rightFoot", top: 325, left: 149, width: 36, height: 25, borderRadius: 12 },
];

const REGION_LABELS: Record<string, { ru: string; kz: string }> = {
  head: { ru: "Голова", kz: "Бас" },
  throat: { ru: "Горло", kz: "Тамақ" },
  leftShoulder: { ru: "Л. плечо", kz: "С. иық" },
  rightShoulder: { ru: "П. плечо", kz: "О. иық" },
  chest: { ru: "Грудь", kz: "Кеуде" },
  leftArm: { ru: "Л. рука", kz: "С. қол" },
  rightArm: { ru: "П. рука", kz: "О. қол" },
  stomach: { ru: "Живот", kz: "Іш" },
  leftHand: { ru: "Л. кисть", kz: "С. алақан" },
  rightHand: { ru: "П. кисть", kz: "О. алақан" },
  hips: { ru: "Бёдра", kz: "Сан" },
  leftLeg: { ru: "Л. нога", kz: "С. аяқ" },
  rightLeg: { ru: "П. нога", kz: "О. аяқ" },
  leftFoot: { ru: "Л. стопа", kz: "С. табан" },
  rightFoot: { ru: "П. стопа", kz: "О. табан" },
};

interface EmotionDef {
  key: string;
  color: string;
}

const EMOTIONS: EmotionDef[] = [
  { key: "emotionJoy", color: "#FACC15" },
  { key: "emotionSadness", color: "#60A5FA" },
  { key: "emotionAnger", color: "#EF4444" },
  { key: "emotionFear", color: "#A855F7" },
  { key: "emotionCalm", color: "#34D399" },
  { key: "emotionTension", color: "#F97316" },
  { key: "emotionPain", color: "#F43F5E" },
  { key: "emotionWarmth", color: "#FB923C" },
  { key: "emotionLove", color: "#EC4899" },
  { key: "emotionAnxiety", color: "#8B5CF6" },
];

type Tab = "map" | "history";

export default function BodyEmotionMapScreen() {
  const t = useT() as any;
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("map");
  const [selectedRegions, setSelectedRegions] = useState<
    Record<string, { emotion: string; color: string }>
  >({});
  const [note, setNote] = useState("");
  const [pickerRegion, setPickerRegion] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: entriesData,
    refetch,
  } = useQuery({
    queryKey: ["cbt", "body_emotion_map"],
    queryFn: () => cbtApi.list("body_emotion_map"),
  });

  const entries = entriesData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => {
      const regions = Object.entries(selectedRegions).map(
        ([regionId, { emotion, color }]) => ({
          regionId,
          emotion,
          color,
        }),
      );
      return cbtApi.create({
        type: "body_emotion_map",
        data: { regions, note: note.trim() || undefined },
      });
    },
    onSuccess: () => {
      setSelectedRegions({});
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["cbt", "body_emotion_map"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cbtApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "body_emotion_map"] });
    },
  });

  const hasSelections = Object.keys(selectedRegions).length > 0;

  const handleRegionPress = (regionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerRegion(regionId);
  };

  const handleEmotionSelect = (emotionKey: string, color: string) => {
    if (!pickerRegion) return;
    setSelectedRegions((prev) => ({
      ...prev,
      [pickerRegion]: { emotion: emotionKey, color },
    }));
    setPickerRegion(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleClearRegion = () => {
    if (!pickerRegion) return;
    setSelectedRegions((prev) => {
      const next = { ...prev };
      delete next[pickerRegion];
      return next;
    });
    setPickerRegion(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: t.exercises.bodyEmotionMap }} />

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderColor: c.borderLight }]}>
        <Pressable
          onPress={() => setTab("map")}
          style={[
            styles.tabItem,
            tab === "map" && { borderBottomColor: c.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: tab === "map" ? c.primary : c.textLight },
            ]}
          >
            {t.exercises.bodyEmotionMap}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("history")}
          style={[
            styles.tabItem,
            tab === "history" && {
              borderBottomColor: c.primary,
              borderBottomWidth: 2,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: tab === "history" ? c.primary : c.textLight },
            ]}
          >
            {t.chat?.history || "История"}
          </Text>
        </Pressable>
      </View>

      {tab === "map" ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instruction */}
          <Text style={[styles.instruction, { color: c.textLight }]}>
            {t.exercises.bodyEmotionMapEmpty}
          </Text>

          {/* Body outline */}
          <View style={styles.bodyContainer}>
            {/* Body silhouette background */}
            <View style={[styles.bodySilhouette, { backgroundColor: c.surfaceSecondary }]}>
              {/* Center line */}
              <View style={[styles.centerLine, { backgroundColor: c.borderLight }]} />
            </View>

            {/* Tappable regions */}
            {BODY_REGIONS.map((region) => {
              const selected = selectedRegions[region.id];
              return (
                <Pressable
                  key={region.id}
                  onPress={() => handleRegionPress(region.id)}
                  style={[
                    styles.region,
                    {
                      top: region.top,
                      left: region.left,
                      width: region.width,
                      height: region.height,
                      borderRadius: region.borderRadius,
                      backgroundColor: selected
                        ? selected.color + "50"
                        : c.surfaceSecondary + "80",
                      borderColor: selected
                        ? selected.color
                        : c.borderLight,
                    },
                  ]}
                >
                  {selected && (
                    <View
                      style={[
                        styles.regionDot,
                        { backgroundColor: selected.color },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Selected emotions legend */}
          {hasSelections && (
            <View style={styles.legendSection}>
              {Object.entries(selectedRegions).map(
                ([regionId, { emotion, color }]) => {
                  const label = REGION_LABELS[
                    BODY_REGIONS.find((r) => r.id === regionId)
                      ?.labelKey ?? ""
                  ];
                  const regionName = label?.ru ?? regionId;
                  const emotionLabel = (t.exercises as any)[emotion] || emotion;
                  return (
                    <View
                      key={regionId}
                      style={[styles.legendItem, { borderColor: color }]}
                    >
                      <View
                        style={[styles.legendDot, { backgroundColor: color }]}
                      />
                      <Text style={[styles.legendText, { color: c.text }]}>
                        {regionName}: {emotionLabel}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>
          )}

          {/* Note */}
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: c.surface,
                borderColor: c.borderLight,
                color: c.text,
              },
            ]}
            placeholder={t.exercises.bodyEmotionMapNote}
            placeholderTextColor={c.textLight}
            value={note}
            onChangeText={setNote}
            multiline
          />

          {/* Save button */}
          <Pressable
            onPress={() => createMutation.mutate()}
            disabled={!hasSelections || createMutation.isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: c.primary },
              (!hasSelections || createMutation.isPending) && { opacity: 0.4 },
              pressed && hasSelections && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{t.common.save}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🫀</Text>
              <Text style={[styles.emptyText, { color: c.textLight }]}>
                {t.exercises.bodyEmotionMapEmpty}
              </Text>
            </View>
          )}

          {entries.map((entry: any) => {
            const data = entry.data as {
              regions: { regionId: string; emotion: string; color: string }[];
              note?: string;
            };
            const date = new Date(entry.createdAt);
            const dateStr = date.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View
                key={entry.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                ]}
              >
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyDate, { color: c.textLight }]}>
                    {dateStr}
                  </Text>
                  <Pressable onPress={() => setDeleteId(entry.id)} hitSlop={8}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={c.textLight}
                    />
                  </Pressable>
                </View>
                <View style={styles.historyRegions}>
                  {data.regions.map((r) => {
                    const label =
                      REGION_LABELS[
                        BODY_REGIONS.find((br) => br.id === r.regionId)
                          ?.labelKey ?? ""
                      ];
                    const emotionLabel =
                      (t.exercises as any)[r.emotion] || r.emotion;
                    return (
                      <View
                        key={r.regionId}
                        style={[
                          styles.historyChip,
                          { backgroundColor: r.color + "20", borderColor: r.color },
                        ]}
                      >
                        <View
                          style={[
                            styles.chipDot,
                            { backgroundColor: r.color },
                          ]}
                        />
                        <Text style={[styles.chipText, { color: c.text }]}>
                          {label?.ru ?? r.regionId}: {emotionLabel}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {data.note && (
                  <Text style={[styles.historyNote, { color: c.textLight }]}>
                    {data.note}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Emotion picker modal */}
      <Modal
        visible={!!pickerRegion}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerRegion(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerRegion(null)}
        >
          <Pressable
            style={[styles.pickerSheet, { backgroundColor: c.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerHandle}>
              <View style={[styles.handle, { backgroundColor: c.borderLight }]} />
            </View>
            <Text style={[styles.pickerTitle, { color: c.text }]}>
              {t.exercises.bodyEmotionMapChoose}
            </Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((emo) => {
                const label = (t.exercises as any)[emo.key] || emo.key;
                const isSelected =
                  pickerRegion &&
                  selectedRegions[pickerRegion]?.emotion === emo.key;
                return (
                  <Pressable
                    key={emo.key}
                    onPress={() => handleEmotionSelect(emo.key, emo.color)}
                    style={[
                      styles.emotionChip,
                      {
                        backgroundColor: emo.color + "20",
                        borderColor: isSelected ? emo.color : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.emotionDot,
                        { backgroundColor: emo.color },
                      ]}
                    />
                    <Text style={[styles.emotionLabel, { color: c.text }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {pickerRegion && selectedRegions[pickerRegion] && (
              <Pressable
                onPress={handleClearRegion}
                style={[styles.clearBtn, { borderColor: c.borderLight }]}
              >
                <Ionicons name="close-circle-outline" size={16} color={c.textLight} />
                <Text style={[styles.clearBtnText, { color: c.textLight }]}>
                  {t.common.delete}
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!deleteId}
        title={t.common.confirmDelete}
        description={t.common.confirmDeleteDescription}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: { fontSize: 14, fontWeight: "700" },

  instruction: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },

  bodyContainer: {
    width: 280,
    height: 360,
    alignSelf: "center",
    marginTop: 16,
    position: "relative",
  },
  bodySilhouette: {
    position: "absolute",
    top: 10,
    left: 90,
    width: 100,
    height: 340,
    borderRadius: 40,
    opacity: 0.3,
  },
  centerLine: {
    position: "absolute",
    left: 49,
    top: 20,
    width: 2,
    height: 300,
    borderRadius: 1,
  },
  region: {
    position: "absolute",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  regionDot: { width: 8, height: 8, borderRadius: 4 },

  legendSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "600" },

  noteInput: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    fontSize: 14,
    minHeight: 60,
    fontFamily: "Nunito-Regular",
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderRadius: radius.lg,
    paddingVertical: 14,
    ...shadow(2),
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  emptyState: { alignItems: "center", marginTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: "center" },

  historyCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: { fontSize: 12, fontWeight: "600" },
  historyRegions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: "600" },
  historyNote: { fontSize: 12, marginTop: 8, lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    ...shadow(3),
  },
  pickerHandle: { alignItems: "center", paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  emotionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emotionDot: { width: 10, height: 10, borderRadius: 5 },
  emotionLabel: { fontSize: 13, fontWeight: "600" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: 16,
  },
  clearBtnText: { fontSize: 13, fontWeight: "600" },
});
