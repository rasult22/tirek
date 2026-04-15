import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import { useRefresh } from "../../../lib/hooks/useRefresh";

export default function JoyJarScreen() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const {
    data: entriesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cbt", "joy_jar"],
    queryFn: () => cbtApi.list("joy_jar"),
  });

  const { refreshing, onRefresh } = useRefresh(refetch);

  const entries = entriesData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      cbtApi.create({ type: "joy_jar", data: { text: text.trim() } }),
    onSuccess: () => {
      setText("");
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ["cbt", "joy_jar"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cbtApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "joy_jar"] });
    },
  });

  const canSave = text.trim().length > 0 && !createMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: t.exercises.joyJar }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.jarEmoji}>🫙</Text>
          <Text style={[styles.title, { color: c.text }]}>
            {t.exercises.joyJar}
          </Text>
          <Text style={[styles.subtitle, { color: c.textLight }]}>
            {t.exercises.joyJarDesc}
          </Text>
        </View>

        {/* Input area */}
        <View
          style={[
            styles.inputCard,
            { backgroundColor: c.surface, borderColor: c.borderLight },
          ]}
        >
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder={t.exercises.joyJarPlaceholder}
            placeholderTextColor={c.textLight}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            {showSaved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={c.success} />
                <Text style={[styles.savedText, { color: c.success }]}>
                  {t.exercises.joyJarSaved}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => createMutation.mutate()}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: c.primary },
                !canSave && { opacity: 0.4 },
                pressed && canSave && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{t.common.save}</Text>
            </Pressable>
          </View>
        </View>

        {/* Entries list */}
        <View style={styles.listSection}>
          {entries.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={[styles.emptyText, { color: c.textLight }]}>
                {t.exercises.joyJarEmpty}
              </Text>
            </View>
          )}

          {entries.map((entry: any) => {
            const data = entry.data as { text: string };
            const date = new Date(entry.createdAt);
            const dateStr = date.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            });
            const timeStr = date.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                ]}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryEmoji}>✨</Text>
                  <Text style={[styles.entryDate, { color: c.textLight }]}>
                    {dateStr}, {timeStr}
                  </Text>
                  <Pressable
                    onPress={() => setDeleteId(entry.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={16} color={c.textLight} />
                  </Pressable>
                </View>
                <Text style={[styles.entryText, { color: c.text }]}>
                  {data.text}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  headerWrap: { alignItems: "center", marginTop: 16 },
  jarEmoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: "center" },

  inputCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow(1),
  },
  input: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    fontFamily: "Nunito-Regular",
  },
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  savedText: { fontSize: 12, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  listSection: { marginTop: 24 },
  emptyState: { alignItems: "center", marginTop: 32 },
  emptyEmoji: { fontSize: 40 },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  entryCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  entryEmoji: { fontSize: 14 },
  entryDate: { flex: 1, fontSize: 12, fontWeight: "600" },
  entryText: { fontSize: 14, lineHeight: 20 },
});
