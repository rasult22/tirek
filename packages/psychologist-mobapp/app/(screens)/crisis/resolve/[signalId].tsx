import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useT } from "../../../../lib/hooks/useLanguage";
import { Text, Body, Button } from "../../../../components/ui";
import { useThemeColors, spacing, radius } from "../../../../lib/theme";
import { crisisApi } from "../../../../lib/api/crisis";
import { hapticLight, hapticSuccess } from "../../../../lib/haptics";
import type { CrisisSignal } from "@tirek/shared";

interface ResolveState {
  notes: string;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
}

export default function ResolveSignalScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signalId } = useLocalSearchParams<{ signalId: string }>();

  const [state, setState] = useState<ResolveState>({
    notes: "",
    contactedStudent: false,
    contactedParent: false,
    documented: false,
  });

  // Find signal in cached red+yellow feeds — no extra round-trip required.
  const { data: redData } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => crisisApi.getFeed("red"),
  });
  const { data: yellowData } = useQuery({
    queryKey: ["crisis", "feed", "yellow"],
    queryFn: () => crisisApi.getFeed("yellow"),
  });

  const signal: CrisisSignal | undefined = [
    ...(redData?.data ?? []),
    ...(yellowData?.data ?? []),
  ].find((s) => s.id === signalId);

  const resolveMutation = useMutation({
    mutationFn: () => crisisApi.resolve(signalId!, state),
    onSuccess: () => {
      hapticSuccess();
      queryClient.invalidateQueries({ queryKey: ["crisis"] });
      router.back();
    },
  });

  function update(patch: Partial<ResolveState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  const isAcute = signal?.type === "acute_crisis";
  const accent = isAcute ? c.danger : c.warning;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.bg }]}
        edges={["top", "bottom"]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { backgroundColor: c.surface, borderBottomColor: c.borderLight },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </Pressable>
            <Body style={{ fontWeight: "700", flex: 1 }} numberOfLines={1}>
              {t.psychologist.resolveSignalTitle}
            </Body>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {signal && (
              <View
                style={[
                  styles.studentRow,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                ]}
              >
                <View
                  style={[styles.avatar, { backgroundColor: `${accent}1A` }]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: accent,
                    }}
                  >
                    {signal.studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body style={{ fontWeight: "600" }} numberOfLines={1}>
                    {signal.studentName}
                  </Body>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 20,
                      color: c.textLight,
                      marginTop: 2,
                    }}
                    numberOfLines={3}
                  >
                    {signal.summary}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.checklist}>
              {(
                [
                  {
                    key: "contactedStudent" as const,
                    icon: "call-outline" as const,
                    label: t.psychologist.contactStudent,
                  },
                  {
                    key: "contactedParent" as const,
                    icon: "people-outline" as const,
                    label: t.psychologist.contactParent,
                  },
                  {
                    key: "documented" as const,
                    icon: "document-text-outline" as const,
                    label: t.psychologist.documentActions,
                  },
                ] as const
              ).map(({ key, icon, label }) => {
                const checked = state[key];
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      hapticLight();
                      update({ [key]: !checked });
                    }}
                    style={[
                      styles.checkItem,
                      {
                        backgroundColor: checked
                          ? `${c.success}14`
                          : c.surfaceSecondary,
                        borderColor: checked
                          ? `${c.success}33`
                          : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: checked ? c.success : "transparent",
                          borderColor: checked ? c.success : c.border,
                        },
                      ]}
                    >
                      {checked && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                    <Ionicons
                      name={icon}
                      size={18}
                      color={checked ? c.success : c.textLight}
                    />
                    <Text style={{ color: c.text, flex: 1 }}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={state.notes}
              onChangeText={(text) => update({ notes: text })}
              placeholder={t.psychologist.resolveNotesPlaceholder}
              placeholderTextColor={c.textLight}
              multiline
              style={[
                styles.notesInput,
                {
                  backgroundColor: c.surfaceSecondary,
                  borderColor: c.border,
                  color: c.text,
                },
              ]}
            />
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: c.bg,
                borderTopColor: c.borderLight,
              },
            ]}
          >
            <Button
              title={t.psychologist.resolveSignal}
              variant="primary"
              onPress={() => resolveMutation.mutate()}
              loading={resolveMutation.isPending}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  checklist: { gap: 8 },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
