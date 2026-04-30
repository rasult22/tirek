import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
import { Text, Body } from "../../../../components/ui";
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
            {/* Student hero — bigger with subtitle */}
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
                      fontSize: 18,
                      fontWeight: "700",
                      color: accent,
                    }}
                  >
                    {signal.studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      lineHeight: 22,
                      fontFamily: "Inter_700Bold",
                      color: c.text,
                    }}
                    numberOfLines={1}
                  >
                    {signal.studentName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      lineHeight: 14,
                      color: c.textLight,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      fontFamily: "Inter_500Medium",
                      marginTop: 2,
                    }}
                  >
                    {t.psychologist.resolveSignalTitle}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      color: c.textLight,
                      marginTop: 6,
                    }}
                    numberOfLines={3}
                  >
                    {signal.summary}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions section */}
            <View>
              <Text style={[styles.sectionEyebrow, { color: c.textLight }]}>
                {t.psychologist.actionsTaken}
              </Text>
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
                            : c.surface,
                          borderColor: checked
                            ? `${c.success}33`
                            : c.borderLight,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: checked
                              ? c.success
                              : "transparent",
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
                      <Text
                        style={{
                          color: c.text,
                          flex: 1,
                          fontSize: 14,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notes section */}
            <View>
              <Text style={[styles.sectionEyebrow, { color: c.textLight }]}>
                {t.psychologist.resolveSignalNotes}
              </Text>
              <TextInput
                value={state.notes}
                onChangeText={(text) => update({ notes: text })}
                placeholder={t.psychologist.resolveNotesPlaceholder}
                placeholderTextColor={c.textLight}
                multiline
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.borderLight,
                    color: c.text,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* Success CTA */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: c.bg,
                borderTopColor: c.borderLight,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                hapticLight();
                resolveMutation.mutate();
              }}
              disabled={resolveMutation.isPending}
              style={({ pressed }) => [
                styles.successCta,
                { backgroundColor: c.success },
                pressed && !resolveMutation.isPending && { opacity: 0.92 },
                resolveMutation.isPending && { opacity: 0.6 },
              ]}
            >
              {resolveMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.successCtaText}>
                    {t.psychologist.resolveSignal}
                  </Text>
                </>
              )}
            </Pressable>
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
    gap: spacing.md,
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
    gap: spacing.lg,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.sm,
  },
  checklist: { gap: 8 },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
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
    borderRadius: radius.lg,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 96,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
  successCta: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  successCtaText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
    letterSpacing: 0.2,
  },
});
