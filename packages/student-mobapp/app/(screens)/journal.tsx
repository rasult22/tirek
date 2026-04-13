import { useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { ErrorState } from "../../components/ErrorState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { journalApi } from "../../lib/api/journal";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { SkeletonList } from "../../components/Skeleton";

export default function JournalScreen() {
  const t = useT();
  const c = useThemeColors();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: prompt } = useQuery({
    queryKey: ["journal", "prompt"],
    queryFn: journalApi.dailyPrompt,
  });

  const {
    data: entries,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["journal", "list"],
    queryFn: journalApi.list,
  });

  const createMutation = useMutation({
    mutationFn: journalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "list"] });
      setContent("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: journalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", "list"] });
    },
  });

  const promptText = prompt
    ? language === "kz"
      ? prompt.kz
      : prompt.ru
    : "";

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate({
      prompt: promptText || undefined,
      content: content.trim(),
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === "kz" ? "kk-KZ" : "ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["bottom"]}>
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={t.journal.deleteConfirm}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          {/* Daily prompt */}
          {promptText ? (
            <View style={[styles.promptCard, { backgroundColor: `${c.primary}14` }]}>
              <View style={styles.promptHeader}>
                <Ionicons name="sparkles" size={14} color={c.primary} />
                <Text style={[styles.promptCaption, { color: c.primary }]}>
                  {t.journal.dailyPrompt}
                </Text>
              </View>
              <Text style={[styles.promptText, { color: c.text }]}>{promptText}</Text>
            </View>
          ) : null}

          {/* New entry form */}
          <Card style={styles.formCard}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={t.journal.placeholder}
              placeholderTextColor={c.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textArea, { backgroundColor: c.surfaceSecondary, color: c.text }]}
            />
            <View style={styles.formFooter}>
              {showSuccess && (
                <Text style={[styles.savedText, { color: c.success }]}>
                  {t.journal.saved}
                </Text>
              )}
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={handleSubmit}
                disabled={!content.trim() || createMutation.isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  content.trim()
                    ? [styles.submitActive, { backgroundColor: c.primary }]
                    : { backgroundColor: c.surfaceSecondary },
                  pressed && content.trim() && { opacity: 0.85 },
                ]}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="send"
                    size={16}
                    color={content.trim() ? "#FFFFFF" : c.textLight}
                  />
                )}
                <Text
                  style={[
                    styles.submitText,
                    !content.trim() && { color: c.textLight },
                  ]}
                >
                  {t.common.save}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Entries list */}
          <View style={styles.entriesSection}>
            <Text variant="caption" style={styles.entriesCaption}>
              {t.journal.entries}
            </Text>

            {isLoading && <SkeletonList count={4} />}

            {!isLoading &&
              (!entries?.data || entries.data.length === 0) && (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIcon, { backgroundColor: `${c.primary}1A` }]}>
                    <Ionicons
                      name="book"
                      size={32}
                      color={c.primary}
                    />
                  </View>
                  <Text variant="bodyLight" style={{ marginTop: 12 }}>
                    {t.journal.noEntries}
                  </Text>
                </View>
              )}

            {entries?.data?.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryContent}>
                  <View style={{ flex: 1 }}>
                    {entry.prompt ? (
                      <Text style={[styles.entryPrompt, { color: c.primary }]}>
                        {entry.prompt}
                      </Text>
                    ) : null}
                    <Text
                      variant="body"
                      style={{ lineHeight: 20 }}
                    >
                      {entry.content}
                    </Text>
                    <Text variant="small" style={{ marginTop: 8 }}>
                      {formatDate(entry.createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setDeleteId(entry.id)}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && { backgroundColor: "rgba(179,59,59,0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={c.textLight}
                    />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Daily prompt
  promptCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: 16,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  promptCaption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  promptText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },

  // Form
  formCard: {
    marginBottom: 8,
  },
  textArea: {
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  formFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  savedText: {
    fontSize: 12,
    fontWeight: "700",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  submitActive: {
    ...shadow(2),
  },
  submitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Entries
  entriesSection: {
    marginTop: 16,
  },
  entriesCaption: {
    marginBottom: 12,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Entry card
  entryCard: {
    marginBottom: 10,
  },
  entryContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  entryPrompt: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
