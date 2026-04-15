import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import type { InviteCode } from "@tirek/shared";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Button } from "../../components/ui";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ErrorState } from "../../components/ErrorState";
import { SkeletonList } from "../../components/Skeleton";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { inviteCodesApi } from "../../lib/api/inviteCodes";
import { hapticLight } from "../../lib/haptics";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

function getCodeStatus(
  code: InviteCode,
): "available" | "used" | "expired" {
  if (code.usedBy) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

export default function InviteCodesScreen() {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [count, setCount] = useState("5");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: codes, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: inviteCodesApi.list,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      inviteCodesApi.generate({
        count: Math.max(1, Math.min(50, Number(count) || 1)),
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      setShowForm(false);
      setCount("5");
      setGrade(null);
      setClassLetter(null);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => inviteCodesApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
  });

  async function copyCode(code: string, id: string) {
    await Clipboard.setStringAsync(code);
    hapticLight();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    available: { bg: `${c.success}26`, text: c.success },
    used: { bg: `${c.textLight}26`, text: c.textLight },
    expired: { bg: `${c.danger}26`, text: c.danger },
  };

  const statusLabels: Record<string, string> = {
    available: t.psychologist.codeAvailable,
    used: t.psychologist.codeUsed,
    expired: t.psychologist.codeExpired,
  };

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: t.psychologist.inviteCodes }} />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t.psychologist.inviteCodes }} />
      <ConfirmDialog
        open={revokeId !== null}
        onConfirm={() => {
          if (revokeId) revokeMutation.mutate(revokeId);
          setRevokeId(null);
        }}
        onCancel={() => setRevokeId(null)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        style={[styles.container, { backgroundColor: c.bg }]}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header row — generate button only, title is in Stack header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              hapticLight();
              setShowForm(!showForm);
            }}
            style={[styles.headerBtn, { backgroundColor: c.primary }]}
          >
            <Ionicons
              name={showForm ? "close" : "add"}
              size={16}
              color="#FFF"
            />
            <Text style={styles.headerBtnText}>
              {showForm ? t.common.cancel : t.psychologist.generateCodes}
            </Text>
          </Pressable>
        </View>

        {/* Generate form */}
        {showForm && (
          <Card style={styles.formCard}>
            <Text variant="h3" style={styles.formTitle}>
              {t.psychologist.generateCodes}
            </Text>

            {/* Count */}
            <Text variant="body" style={styles.fieldLabel}>
              {t.psychologist.codeCount} (1-50)
            </Text>
            <View
              style={[
                styles.countInput,
                { borderColor: c.borderLight, backgroundColor: c.surface },
              ]}
            >
              <TextInput
                value={count}
                onChangeText={(text) => setCount(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={2}
                style={[styles.countText, { color: c.text }]}
                placeholderTextColor={c.textLight}
              />
            </View>

            {/* Grade chips */}
            <Text variant="body" style={styles.fieldLabel}>
              {t.auth.selectGrade}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <Pressable
                onPress={() => {
                  hapticLight();
                  setGrade(null);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      grade === null ? c.primary : c.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    color: grade === null ? "#FFF" : c.textLight,
                  }}
                >
                  {t.psychologist.codeAny}
                </Text>
              </Pressable>
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    hapticLight();
                    setGrade(grade === g ? null : g);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        grade === g ? c.primary : c.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: grade === g ? "#FFF" : c.textLight,
                    }}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Class chips */}
            <Text variant="body" style={[styles.fieldLabel, { marginTop: 12 }]}>
              {t.auth.selectClass}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <Pressable
                onPress={() => {
                  hapticLight();
                  setClassLetter(null);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      classLetter === null ? c.primary : c.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  variant="small"
                  style={{
                    fontFamily: "DMSans-SemiBold",
                    color: classLetter === null ? "#FFF" : c.textLight,
                  }}
                >
                  {t.psychologist.codeAny}
                </Text>
              </Pressable>
              {CLASS_LETTERS.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => {
                    hapticLight();
                    setClassLetter(classLetter === l ? null : l);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        classLetter === l ? c.primary : c.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      color: classLetter === l ? "#FFF" : c.textLight,
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Generate button */}
            <Pressable
              onPress={() => {
                hapticLight();
                generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              style={[
                styles.generateBtn,
                {
                  backgroundColor: generateMutation.isPending
                    ? `${c.primary}60`
                    : c.primary,
                },
              ]}
            >
              {generateMutation.isPending && (
                <ActivityIndicator size="small" color="#FFF" />
              )}
              <Text style={styles.generateBtnText}>
                {t.psychologist.generateCodes}
              </Text>
            </Pressable>

            {generateMutation.isError && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: `${c.danger}1A` },
                ]}
              >
                <Text variant="body" style={{ color: c.danger }}>
                  {t.common.error}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Codes list */}
        {isLoading ? (
          <SkeletonList count={3} />
        ) : codes && codes.data.length > 0 ? (
          <View style={styles.codesList}>
            {codes.data.map((code) => {
              const status = getCodeStatus(code);
              const sc = statusColors[status];
              return (
                <Card key={code.id} style={styles.codeCard}>
                  {/* Top row: code + status badge */}
                  <View style={styles.codeTopRow}>
                    <View
                      style={[
                        styles.codeTag,
                        { backgroundColor: c.surfaceSecondary },
                      ]}
                    >
                      <Text
                        style={[styles.codeText, { color: c.text }]}
                        numberOfLines={1}
                      >
                        {code.code}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: sc.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: sc.text }]}>
                        {statusLabels[status]}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom row: info + actions */}
                  <View style={styles.codeBottomRow}>
                    <Text variant="caption" style={{ flex: 1 }}>
                      {code.grade
                        ? `${code.grade}${code.classLetter ?? ""}`
                        : "\u2014"}{" "}
                      {"\u00B7"}{" "}
                      {new Date(code.createdAt).toLocaleDateString()}
                      {code.usedBy ? ` \u00B7 ${code.usedBy}` : ""}
                    </Text>
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => copyCode(code.code, code.id)}
                        style={styles.actionBtn}
                      >
                        <Ionicons
                          name={
                            copiedId === code.id
                              ? "checkmark"
                              : "copy-outline"
                          }
                          size={16}
                          color={
                            copiedId === code.id ? c.success : c.textLight
                          }
                        />
                      </Pressable>
                      {status === "available" && (
                        <Pressable
                          onPress={() => {
                            hapticLight();
                            setRevokeId(code.id);
                          }}
                          disabled={revokeMutation.isPending}
                          style={styles.actionBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color={c.danger}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={styles.centerBlock}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons name="key-outline" size={32} color={c.textLight} />
            </View>
            <Text variant="bodyLight">{t.common.noData}</Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  headerBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "DMSans-SemiBold",
  },
  formCard: {
    marginBottom: 16,
    padding: spacing.lg,
  },
  formTitle: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: "DMSans-SemiBold",
    marginBottom: 6,
    marginTop: 8,
  },
  countInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  countText: {
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    padding: 0,
  },
  chipsRow: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: 16,
  },
  generateBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "DMSans-SemiBold",
  },
  errorBanner: {
    padding: 12,
    borderRadius: radius.sm,
    marginTop: 8,
  },
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  codesList: {
    gap: 8,
  },
  codeCard: {
    padding: 14,
  },
  codeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  codeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  codeText: {
    fontSize: 13,
    fontFamily: "DMSans-Medium",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "DMSans-SemiBold",
  },
  codeBottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
