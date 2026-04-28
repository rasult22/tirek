import { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import type { InviteCode } from "@tirek/shared";
import { useT } from "../../lib/hooks/useLanguage";
import { Text } from "../ui";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ConfirmDialog";
import { ErrorState } from "../ErrorState";
import { SkeletonList } from "../Skeleton";
import { useThemeColors, radius } from "../../lib/theme";
import { inviteCodesApi } from "../../lib/api/inviteCodes";
import { hapticLight } from "../../lib/haptics";

function getCodeStatus(
  code: InviteCode,
): "available" | "used" | "expired" {
  if (code.usedBy) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

interface PendingListProps {
  onGenerateNew: (prefill: {
    name: string;
    grade: number | null;
    classLetter: string | null;
  }) => void;
}

export function PendingList({ onGenerateNew }: PendingListProps) {
  const t = useT();
  const c = useThemeColors();
  const queryClient = useQueryClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const {
    data: codes,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: inviteCodesApi.list,
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

  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading) return <SkeletonList count={3} />;

  const visible = (codes?.data ?? []).filter((cd) => {
    const s = getCodeStatus(cd);
    return s === "available" || s === "expired";
  });

  if (visible.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View
          style={[styles.emptyIcon, { backgroundColor: `${c.textLight}1A` }]}
        >
          <Ionicons name="key-outline" size={32} color={c.textLight} />
        </View>
        <Text variant="bodyLight">{t.psychologist.pendingEmpty}</Text>
      </View>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={revokeId !== null}
        onConfirm={() => {
          if (revokeId) revokeMutation.mutate(revokeId);
          setRevokeId(null);
        }}
        onCancel={() => setRevokeId(null)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.primary}
          />
        }
      >
        {visible.map((code) => {
          const status = getCodeStatus(code);
          const isExpired = status === "expired";
          return (
            <Card key={code.id} style={styles.codeCard}>
              <View style={styles.codeTopRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View
                    style={[
                      styles.codeTag,
                      {
                        backgroundColor: c.surfaceSecondary,
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text style={[styles.codeText, { color: c.text }]}>
                      {code.code}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      fontSize: 13,
                      color: c.text,
                    }}
                    numberOfLines={1}
                  >
                    {code.studentRealName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isExpired
                        ? `${c.textLight}26`
                        : `${c.success}26`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isExpired ? c.textLight : c.success },
                    ]}
                  >
                    {isExpired
                      ? t.psychologist.codeExpired
                      : t.psychologist.codeAvailable}
                  </Text>
                </View>
              </View>

              <View style={styles.codeBottomRow}>
                <Text variant="caption" style={{ flex: 1 }}>
                  {code.grade
                    ? `${code.grade}${code.classLetter ?? ""}`
                    : "—"}
                  {!isExpired
                    ? ` · ${t.psychologist.expiresInDays.replace(
                        "{days}",
                        String(daysUntil(code.expiresAt)),
                      )}`
                    : ""}
                </Text>

                {isExpired ? (
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      onGenerateNew({
                        name: code.studentRealName ?? "",
                        grade: code.grade ?? null,
                        classLetter: code.classLetter ?? null,
                      });
                    }}
                    style={[
                      styles.regenBtn,
                      { backgroundColor: `${c.primary}1A` },
                    ]}
                  >
                    <Ionicons name="refresh" size={12} color={c.primary} />
                    <Text
                      style={{
                        fontFamily: "DMSans-SemiBold",
                        fontSize: 11,
                        color: c.primary,
                      }}
                    >
                      {t.psychologist.generateNewCode}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => copyCode(code.code, code.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name={
                          copiedId === code.id ? "checkmark" : "copy-outline"
                        }
                        size={16}
                        color={
                          copiedId === code.id ? c.success : c.textLight
                        }
                      />
                    </Pressable>
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
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
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
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
