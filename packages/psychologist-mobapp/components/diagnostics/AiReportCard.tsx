import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Text } from "../ui";
import { Skeleton } from "../Skeleton";
import { useThemeColors, radius, type ThemeColors } from "../../lib/theme";
import { diagnosticsApi } from "../../lib/api/diagnostics";
import { colors as ds } from "@tirek/shared/design-system";
import type {
  AiReportRecommendationType,
  DiagnosticAiReport,
} from "@tirek/shared";

interface AiReportCardProps {
  sessionId: string;
}

function riskStyles(c: ThemeColors): Record<
  string,
  { bg: string; text: string; label: string }
> {
  return {
    low: { bg: ds.successSoft, text: c.success, label: "Низкий" },
    moderate: { bg: ds.warningSoft, text: c.warning, label: "Средний" },
    high: { bg: ds.dangerSoft, text: c.danger, label: "Высокий" },
  };
}

function recommendationMeta(c: ThemeColors): Record<
  AiReportRecommendationType,
  { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; color: string }
> {
  return {
    therapy: {
      icon: "people",
      label: "Индивидуальная беседа",
      bg: ds.infoSoft,
      color: c.info,
    },
    exercise: {
      icon: "leaf",
      label: "Упражнение",
      bg: ds.successSoft,
      color: c.success,
    },
    referral: {
      icon: "medkit",
      label: "Направление",
      bg: ds.dangerSoft,
      color: c.danger,
    },
    monitoring: {
      icon: "trending-up",
      label: "Наблюдение",
      bg: c.surfaceSecondary,
      color: c.textLight,
    },
    conversation: {
      icon: "people",
      label: "Разговор",
      bg: ds.brandSoft,
      color: c.primary,
    },
  };
}

function isReadyReport(
  r: DiagnosticAiReport | { status: "pending" } | undefined,
): r is DiagnosticAiReport {
  return Boolean(r && "summary" in r && r.status === "ready");
}

function isErrorReport(
  r: DiagnosticAiReport | { status: "pending" } | undefined,
): r is DiagnosticAiReport {
  return Boolean(r && "status" in r && r.status === "error");
}

export function AiReportCard({ sessionId }: AiReportCardProps) {
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const [flaggedOpen, setFlaggedOpen] = useState(false);

  const RISK_STYLES = riskStyles(c);
  const RECOMMENDATION_META = recommendationMeta(c);

  const { data: report, isLoading } = useQuery({
    queryKey: ["diagnostics", "report", sessionId],
    queryFn: () => diagnosticsApi.getReport(sessionId),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 3000;
      if ("status" in d && d.status === "pending") return 3000;
      return false;
    },
  });

  const { data: answers } = useQuery({
    queryKey: ["diagnostics", "answers", sessionId],
    queryFn: () => diagnosticsApi.getSessionAnswers(sessionId),
    enabled: isReadyReport(report),
  });

  const regenerate = useMutation({
    mutationFn: () => diagnosticsApi.regenerateReport(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnostics", "report", sessionId],
      });
    },
  });

  const flaggedWithText = useMemo(() => {
    if (!isReadyReport(report) || !report.flaggedItems || !answers) return [];
    return report.flaggedItems.map((f) => {
      const a = answers.items.find((i) => i.questionIndex === f.questionIndex);
      return {
        ...f,
        questionText: a?.questionText ?? null,
        answerLabel: a?.answerLabel ?? null,
        answerValue: a?.answer ?? null,
      };
    });
  }, [report, answers]);

  // Loading / Pending
  if (isLoading || !report || (!isReadyReport(report) && !isErrorReport(report))) {
    return (
      <View style={[styles.card, { borderColor: c.borderLight, backgroundColor: c.surface }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: ds.brandSoft }]}>
            <ActivityIndicator size="small" color={c.primary} />
          </View>
          <View>
            <Text style={[styles.headerLabel, { color: c.primary }]}>AI-АНАЛИЗ РЕЗУЛЬТАТА</Text>
            <Text style={[styles.headerSub, { color: c.textLight }]}>
              Генерируется…
            </Text>
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Skeleton style={{ height: 12, width: "75%", borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: "100%", borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: "85%", borderRadius: 4 }} />
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Skeleton style={{ height: 40, borderRadius: 12 }} />
          <Skeleton style={{ height: 40, borderRadius: 12 }} />
        </View>
      </View>
    );
  }

  // Error
  if (isErrorReport(report)) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: `${c.danger}33`, backgroundColor: ds.dangerSoft },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="alert-circle" size={18} color={c.danger} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: c.danger }}>
            Не удалось сгенерировать отчёт
          </Text>
        </View>
        {report.errorMessage && (
          <Text style={{ fontSize: 12, color: c.danger, marginTop: 8 }}>
            {report.errorMessage}
          </Text>
        )}
        <Pressable
          onPress={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: c.danger },
            pressed && { opacity: 0.8 },
            regenerate.isPending && { opacity: 0.6 },
          ]}
        >
          {regenerate.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="refresh" size={14} color="#FFF" />
          )}
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFF" }}>
            Перегенерировать
          </Text>
        </Pressable>
      </View>
    );
  }

  // Ready
  return (
    <View style={[styles.card, { borderColor: c.borderLight, backgroundColor: c.surface }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: ds.brandSoft }]}>
          <Ionicons name="hardware-chip-outline" size={18} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerLabel, { color: c.primary }]}>AI-АНАЛИЗ РЕЗУЛЬТАТА</Text>
          {report.generatedAt && (
            <Text style={[styles.headerSub, { color: c.textLight }]}>
              Сформировано{" "}
              {new Date(report.generatedAt).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Summary */}
      {report.summary && (
        <Text style={[styles.summary, { color: c.text }]}>
          {report.summary}
        </Text>
      )}

      {/* Interpretation */}
      {report.interpretation && (
        <View style={{ marginTop: 12 }}>
          <SectionTitle icon="sparkles" label="Интерпретация" color={c.textLight} />
          <Text style={[styles.bodyText, { color: c.text }]}>
            {report.interpretation}
          </Text>
        </View>
      )}

      {/* Trend */}
      {report.trend && (
        <View
          style={[
            styles.trendBox,
            { borderColor: c.borderLight, backgroundColor: c.surfaceSecondary },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="trending-up" size={14} color={c.textLight} />
            <Text style={[styles.sectionLabel, { color: c.textLight }]}>
              ДИНАМИКА
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: c.text, marginTop: 4 }}>
            {report.trend}
          </Text>
        </View>
      )}

      {/* Risk factors */}
      {report.riskFactors && report.riskFactors.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <SectionTitle icon="shield-half" label="Факторы риска" color={c.textLight} />
          <View style={{ gap: 8, marginTop: 8 }}>
            {report.riskFactors.map((rf, idx) => {
              const meta = RISK_STYLES[rf.severity] ?? RISK_STYLES.moderate;
              return (
                <View
                  key={idx}
                  style={[
                    styles.listItem,
                    { borderColor: c.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: meta.text,
                      }}
                    >
                      {meta.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: c.text,
                      }}
                    >
                      {rf.factor}
                    </Text>
                    {rf.evidence && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: c.textLight,
                          marginTop: 2,
                        }}
                      >
                        {rf.evidence}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <SectionTitle icon="checkmark-circle" label="Рекомендации" color={c.textLight} />
          <View style={{ gap: 8, marginTop: 8 }}>
            {report.recommendations.map((r, idx) => {
              const meta =
                RECOMMENDATION_META[r.type] ?? RECOMMENDATION_META.monitoring;
              return (
                <View
                  key={idx}
                  style={[
                    styles.listItem,
                    { borderColor: c.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.recIcon,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: c.text,
                        marginTop: 2,
                      }}
                    >
                      {r.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Flagged items */}
      {flaggedWithText.length > 0 && (
        <View
          style={[
            styles.flaggedSection,
            {
              borderColor: `${c.warning}33`,
              backgroundColor: ds.warningSoft,
            },
          ]}
        >
          <Pressable
            onPress={() => setFlaggedOpen(!flaggedOpen)}
            style={styles.flaggedHeader}
          >
            <Ionicons name="warning" size={14} color={c.warning} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: c.warning,
                flex: 1,
              }}
            >
              Тревожные ответы ({flaggedWithText.length})
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={c.warning}
              style={{
                transform: [{ rotate: flaggedOpen ? "180deg" : "0deg" }],
              }}
            />
          </Pressable>
          {flaggedOpen && (
            <View style={{ gap: 8, marginTop: 8 }}>
              {flaggedWithText.map((f, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.flaggedItem,
                    {
                      borderColor: `${c.warning}33`,
                      backgroundColor: c.surface,
                    },
                  ]}
                >
                  {f.questionText && (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: c.text,
                      }}
                    >
                      {f.questionText}
                    </Text>
                  )}
                  {(f.answerLabel || f.answerValue !== null) && (
                    <Text style={{ fontSize: 12, color: c.textLight, marginTop: 4 }}>
                      Ответ:{" "}
                      <Text
                        style={{
                          fontWeight: "700",
                          color: c.warning,
                        }}
                      >
                        {f.answerLabel ?? `значение ${f.answerValue}`}
                      </Text>
                    </Text>
                  )}
                  {f.reason && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontStyle: "italic",
                        color: c.textLight,
                        marginTop: 4,
                      }}
                    >
                      {f.reason}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Disclaimer */}
      <View style={[styles.disclaimer, { backgroundColor: c.surfaceSecondary }]}>
        <Ionicons name="information-circle" size={12} color={c.textLight} />
        <Text style={{ fontSize: 11, color: c.textLight, flex: 1, lineHeight: 16 }}>
          Отчёт сформирован ИИ на основе ответов ученика и требует
          профессиональной оценки специалистом.
        </Text>
      </View>

      {/* Regenerate */}
      <Pressable
        onPress={() => regenerate.mutate()}
        disabled={regenerate.isPending}
        style={({ pressed }) => [
          styles.regenerateBtn,
          { borderColor: c.borderLight, backgroundColor: c.surface },
          pressed && { opacity: 0.7 },
          regenerate.isPending && { opacity: 0.6 },
        ]}
      >
        {regenerate.isPending ? (
          <ActivityIndicator size="small" color={c.textLight} />
        ) : (
          <Ionicons name="refresh" size={16} color={c.textLight} />
        )}
        <Text style={{ fontSize: 13, fontWeight: "600", color: c.textLight }}>
          Перегенерировать отчёт
        </Text>
      </Pressable>
    </View>
  );
}

function SectionTitle({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    minHeight: 44,
  },
  summary: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trendBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  listItem: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  recIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  flaggedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flaggedItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
});
