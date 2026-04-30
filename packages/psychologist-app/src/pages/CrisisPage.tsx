import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { directChatApi } from "../api/direct-chat.js";
import { useT } from "../hooks/useLanguage.js";
import { getFeed, getHistory, resolve } from "../api/crisis.js";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
  Users,
  FileText,
  Shield,
  MessageCircle,
  ChevronDown,
  X,
  Check,
  Minus,
} from "lucide-react";
import { useNavigate } from "react-router";
import { clsx } from "clsx";
import { toast } from "sonner";
import type {
  CrisisFeed,
  CrisisSignal,
  CrisisSignalSeverity,
  CrisisSignalSource,
} from "@tirek/shared";
import { ErrorState } from "../components/ui/ErrorState.js";

interface ResolveState {
  notes: string;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
}

export function CrisisPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeFeed, setActiveFeed] = useState<CrisisFeed>("red");
  const [resolveStates, setResolveStates] = useState<
    Record<string, ResolveState>
  >({});
  const [resolveSheetId, setResolveSheetId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const openStudentChat = useCallback(
    async (studentId: string) => {
      setOpeningChat(studentId);
      try {
        const conv = await directChatApi.createConversation(studentId);
        navigate(`/messages/${conv.id}`);
      } catch {
        toast.error(t.common.actionFailed);
        setOpeningChat(null);
      }
    },
    [navigate, t],
  );

  const {
    data: redData,
    isLoading: redLoading,
    isError: redError,
    refetch: refetchRed,
  } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => getFeed("red"),
    refetchInterval: 15_000,
  });

  const {
    data: yellowData,
    isLoading: yellowLoading,
    isError: yellowError,
    refetch: refetchYellow,
  } = useQuery({
    queryKey: ["crisis", "feed", "yellow"],
    queryFn: () => getFeed("yellow"),
    refetchInterval: 30_000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: getHistory,
    enabled: historyOpen,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveState }) =>
      resolve(id, data),
    onSuccess: () => {
      setResolveSheetId(null);
      queryClient.invalidateQueries({ queryKey: ["crisis"] });
      toast.success(t.common.saved);
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  function getState(id: string): ResolveState {
    return (
      resolveStates[id] ?? {
        notes: "",
        contactedStudent: false,
        contactedParent: false,
        documented: false,
      }
    );
  }

  function updateState(id: string, update: Partial<ResolveState>) {
    setResolveStates((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...update },
    }));
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t.psychologist.timeAgoLessThanMinute;
    if (minutes < 60) return `${minutes}${t.psychologist.timeAgoMinutes}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t.psychologist.timeAgoHours}`;
    return `${Math.floor(hours / 24)}${t.psychologist.timeAgoDays}`;
  }

  function sourceLabel(source: CrisisSignalSource) {
    switch (source) {
      case "sos_urgent":
        return t.psychologist.signalSourceSosUrgent;
      case "ai_friend":
        return t.psychologist.signalSourceAiFriend;
      case "diagnostics":
        return t.psychologist.signalSourceDiagnostics;
    }
  }

  function severityLabel(severity: CrisisSignalSeverity) {
    switch (severity) {
      case "high":
        return t.psychologist.severityHigh;
      case "medium":
        return t.psychologist.severityMedium;
      case "low":
        return t.psychologist.severityLow;
    }
  }

  const redSignals = redData?.data ?? [];
  const yellowSignals = yellowData?.data ?? [];
  const historySignals = history?.data ?? [];

  if (redError && yellowError) {
    return <ErrorState onRetry={() => { refetchRed(); refetchYellow(); }} />;
  }

  const isRed = activeFeed === "red";
  const currentSignals = isRed ? redSignals : yellowSignals;
  const currentLoading = isRed ? redLoading : yellowLoading;

  const resolveSignal = resolveSheetId
    ? [...redSignals, ...yellowSignals].find((s) => s.id === resolveSheetId)
    : null;

  const renderSignalCard = (signal: CrisisSignal, kind: "red" | "yellow") => (
    <div
      key={signal.id}
      className={clsx(
        "rounded-2xl overflow-hidden border bg-surface",
        kind === "red" ? "border-danger/15" : "border-warning/15",
        kind === "red" && signal.severity === "high" && "ring-1 ring-danger/40",
      )}
    >
      {kind === "red" && (
        <div className="h-1 bg-gradient-to-r from-danger via-danger/70 to-danger" />
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
              kind === "red"
                ? "bg-danger/10 text-danger"
                : "bg-warning/10 text-warning",
            )}
          >
            {signal.studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-text-main truncate">
              {signal.studentName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-light">
              {signal.studentGrade !== null && (
                <>
                  <span>
                    {signal.studentGrade}
                    {signal.studentClassLetter ?? ""}
                  </span>
                  <span className="opacity-30">·</span>
                </>
              )}
              <Clock size={11} />
              <span>{formatTimeAgo(signal.createdAt)}</span>
              <span className="opacity-30">·</span>
              <span>{sourceLabel(signal.source)}</span>
            </div>
          </div>
          <span
            className={clsx(
              "shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide",
              signal.severity === "high" &&
                (kind === "red"
                  ? "bg-danger text-white"
                  : "bg-warning text-white"),
              signal.severity === "medium" && "bg-warning text-white",
              signal.severity === "low" &&
                "bg-surface-secondary text-text-light",
            )}
          >
            {severityLabel(signal.severity)}
          </span>
        </div>

        <div
          className={clsx(
            "mb-3 rounded-xl px-3 py-2.5 border",
            kind === "red"
              ? "bg-danger/5 border-danger/10"
              : "bg-warning/5 border-warning/15",
          )}
        >
          <p className="text-[13px] text-text-main leading-relaxed">
            {signal.summary}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => openStudentChat(signal.studentId)}
            disabled={openingChat === signal.studentId}
            className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            {openingChat === signal.studentId ? (
              <Loader2 size={16} className="animate-spin text-success" />
            ) : (
              <MessageCircle size={16} className="text-success" />
            )}
            <span className="text-[11px] font-medium text-text-main">
              {t.psychologist.writeMessage}
            </span>
          </button>
          <button
            onClick={() => setResolveSheetId(signal.id)}
            className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover transition-colors"
          >
            <CheckCircle size={16} className="text-text-light" />
            <span className="text-[11px] font-medium text-text-main">
              {t.psychologist.resolveSignal}
            </span>
          </button>
          <button
            onClick={() => navigate(`/students/${signal.studentId}`)}
            className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover transition-colors"
          >
            <Users size={16} className="text-primary" />
            <span className="text-[11px] font-medium text-text-main">
              {t.psychologist.profile}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmptyFeed = (kind: "red" | "yellow") => (
    <div className="rounded-2xl bg-surface border border-border-light p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
        {kind === "red" ? (
          <Shield size={24} className="text-success" />
        ) : (
          <AlertTriangle size={24} className="text-success" />
        )}
      </div>
      <p className="text-[15px] font-semibold text-text-main">
        {kind === "red"
          ? t.psychologist.noRedFeedSignals
          : t.psychologist.noYellowFeedSignals}
      </p>
      <p className="text-xs text-text-light mt-1">{t.psychologist.allCalm}</p>
    </div>
  );

  const renderColumnHeader = (kind: "red" | "yellow", count: number) => (
    <div className="flex items-center gap-2 mb-3">
      <span
        className={clsx(
          "w-2 h-2 rounded-full",
          kind === "red" ? "bg-danger animate-pulse" : "bg-warning",
        )}
      />
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-main">
        {kind === "red"
          ? t.psychologist.redFeedFull
          : t.psychologist.yellowFeedFull}
      </h2>
      {count > 0 && (
        <span
          className={clsx(
            "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
            kind === "red"
              ? "bg-danger text-white"
              : "bg-warning text-white",
          )}
        >
          {count}
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-5 animate-fade-in-up">
        <h1 className="text-xl font-bold tracking-tight text-text-main">
          {t.psychologist.crisis}
        </h1>

        {/* ── DESKTOP: two-column (≥xl) ── */}
        <div className="hidden xl:grid xl:grid-cols-2 xl:gap-6">
          <section>
            {renderColumnHeader("red", redSignals.length)}
            {redLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-text-light" />
              </div>
            ) : redSignals.length > 0 ? (
              <div className="space-y-2.5">
                {redSignals.map((s) => renderSignalCard(s, "red"))}
              </div>
            ) : (
              renderEmptyFeed("red")
            )}
          </section>
          <section>
            {renderColumnHeader("yellow", yellowSignals.length)}
            {yellowLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-text-light" />
              </div>
            ) : yellowSignals.length > 0 ? (
              <div className="space-y-2.5">
                {yellowSignals.map((s) => renderSignalCard(s, "yellow"))}
              </div>
            ) : (
              renderEmptyFeed("yellow")
            )}
          </section>
        </div>

        {/* ── MOBILE / TABLET: tabs (<xl) ── */}
        <div className="xl:hidden space-y-5">
          <div className="flex gap-2 p-1 rounded-2xl bg-surface-secondary">
            <button
              onClick={() => setActiveFeed("red")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                isRed
                  ? "bg-surface text-text-main shadow-sm"
                  : "text-text-light",
              )}
            >
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isRed ? "bg-danger animate-pulse" : "bg-danger/50",
                )}
              />
              {t.psychologist.redFeed}
              {redSignals.length > 0 && (
                <span
                  className={clsx(
                    "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                    isRed
                      ? "bg-danger text-white"
                      : "bg-danger/10 text-danger",
                  )}
                >
                  {redSignals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFeed("yellow")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                !isRed
                  ? "bg-surface text-text-main shadow-sm"
                  : "text-text-light",
              )}
            >
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  !isRed ? "bg-warning" : "bg-warning/50",
                )}
              />
              {t.psychologist.yellowFeed}
              {yellowSignals.length > 0 && (
                <span
                  className={clsx(
                    "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                    !isRed
                      ? "bg-warning text-white"
                      : "bg-warning/10 text-warning",
                  )}
                >
                  {yellowSignals.length}
                </span>
              )}
            </button>
          </div>

          <section>
            {currentLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-text-light" />
              </div>
            ) : currentSignals.length > 0 ? (
              <div className="space-y-2.5 stagger-children">
                {currentSignals.map((s) =>
                  renderSignalCard(s, isRed ? "red" : "yellow"),
                )}
              </div>
            ) : (
              renderEmptyFeed(isRed ? "red" : "yellow")
            )}
          </section>
        </div>

        {/* ── RESOLVED HISTORY (always full width) ── */}
        <section>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-secondary flex items-center justify-center">
                <CheckCircle size={14} className="text-success" />
              </div>
              <h2 className="text-sm font-bold text-text-main">
                {t.psychologist.resolvedHistory}
              </h2>
            </div>
            <ChevronDown
              size={16}
              className={clsx(
                "text-text-light transition-transform duration-200",
                historyOpen && "rotate-180",
              )}
            />
          </button>

          {historyOpen && (
            <div className="mt-1">
              {historyLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2
                    size={20}
                    className="animate-spin text-text-light"
                  />
                </div>
              ) : historySignals.length > 0 ? (
                <div className="space-y-2 stagger-children">
                  {historySignals.map((signal) => {
                    const isExpanded = expandedHistoryId === signal.id;
                    const actions = [
                      {
                        done: signal.contactedStudent,
                        label: t.psychologist.contactedStudentDone,
                      },
                      {
                        done: signal.contactedParent,
                        label: t.psychologist.contactedParentDone,
                      },
                      {
                        done: signal.documented,
                        label: t.psychologist.documentedDone,
                      },
                    ];
                    const hasAnyAction = actions.some((a) => a.done);

                    return (
                      <div
                        key={signal.id}
                        className="rounded-xl bg-surface border border-border overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedHistoryId(
                              isExpanded ? null : signal.id,
                            )
                          }
                          className="w-full flex items-center gap-3 p-3 text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
                            <CheckCircle size={14} className="text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-main truncate">
                              {signal.studentName}
                            </p>
                            {!isExpanded && (
                              <p className="text-xs text-text-light truncate mt-0.5">
                                {signal.summary}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={clsx(
                                "px-1.5 py-0.5 text-[10px] font-bold rounded-md",
                                signal.type === "acute_crisis"
                                  ? "bg-danger/10 text-danger"
                                  : "bg-warning/10 text-warning",
                              )}
                            >
                              {signal.type === "acute_crisis"
                                ? t.psychologist.redFeed
                                : t.psychologist.yellowFeed}
                            </span>
                            <ChevronDown
                              size={14}
                              className={clsx(
                                "text-text-light transition-transform duration-200",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-border animate-fade-in-up">
                            <div className="grid grid-cols-2 gap-2.5 mt-3">
                              <div>
                                <p className="text-[10px] text-text-light uppercase tracking-wide">
                                  {t.psychologist.triggeredAt}
                                </p>
                                <p className="text-xs font-medium text-text-main mt-0.5">
                                  {new Date(signal.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {signal.resolvedAt && (
                                <div>
                                  <p className="text-[10px] text-text-light uppercase tracking-wide">
                                    {t.psychologist.resolvedAtLabel}
                                  </p>
                                  <p className="text-xs font-medium text-text-main mt-0.5">
                                    {new Date(
                                      signal.resolvedAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-text-light uppercase tracking-wide">
                                  {t.psychologist.student}
                                </p>
                                <p className="text-xs font-medium text-text-main mt-0.5">
                                  {signal.studentName}
                                  {signal.studentGrade !== null
                                    ? ` · ${signal.studentGrade}${signal.studentClassLetter ?? ""}`
                                    : ""}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-text-light uppercase tracking-wide">
                                  {t.psychologist.signalSummary}
                                </p>
                                <p className="text-xs font-medium text-text-main mt-0.5">
                                  {sourceLabel(signal.source)} ·{" "}
                                  {severityLabel(signal.severity)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 bg-surface-secondary rounded-lg px-3 py-2">
                              <p className="text-[13px] text-text-main leading-relaxed">
                                {signal.summary}
                              </p>
                            </div>

                            {signal.resolutionNotes && (
                              <div className="mt-2 bg-surface-secondary rounded-lg px-3 py-2">
                                <p className="text-[13px] text-text-main leading-relaxed">
                                  {signal.resolutionNotes}
                                </p>
                              </div>
                            )}

                            <div className="mt-3">
                              <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">
                                {t.psychologist.actionsTaken}
                              </p>
                              {hasAnyAction ? (
                                <div className="space-y-1">
                                  {actions.map(({ done, label }) => (
                                    <div
                                      key={label}
                                      className="flex items-center gap-2"
                                    >
                                      {done ? (
                                        <Check
                                          size={12}
                                          className="text-success shrink-0"
                                        />
                                      ) : (
                                        <Minus
                                          size={12}
                                          className="text-text-light shrink-0"
                                        />
                                      )}
                                      <span
                                        className={clsx(
                                          "text-xs",
                                          done
                                            ? "text-text-main"
                                            : "text-text-light",
                                        )}
                                      >
                                        {label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-text-light">
                                  {t.psychologist.noActionsTaken}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-light text-center py-6">
                  {t.common.noData}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── RESOLVE PANEL: slide-in from right on lg+, bottom sheet below ── */}
      {resolveSignal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:flex-row lg:justify-end"
          onClick={() => setResolveSheetId(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className={clsx(
              "relative bg-surface overflow-y-auto safe-bottom",
              "rounded-t-3xl max-h-[85dvh] animate-slide-up",
              "lg:rounded-t-none lg:rounded-l-3xl lg:max-h-none lg:h-full lg:w-[420px]",
              "lg:animate-fade-in-up",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-6 pt-2 lg:pt-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      resolveSignal.type === "acute_crisis"
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {resolveSignal.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-text-main">
                      {resolveSignal.studentName}
                    </p>
                    <p className="text-xs text-text-light">
                      {t.psychologist.resolveSignalTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResolveSheetId(null)}
                  className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center hover:bg-surface-hover"
                >
                  <X size={16} className="text-text-light" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {(
                  [
                    {
                      key: "contactedStudent" as const,
                      icon: Phone,
                      label: t.psychologist.contactStudent,
                    },
                    {
                      key: "contactedParent" as const,
                      icon: Users,
                      label: t.psychologist.contactParent,
                    },
                    {
                      key: "documented" as const,
                      icon: FileText,
                      label: t.psychologist.documentActions,
                    },
                  ] as const
                ).map(({ key, icon: Icon, label }) => {
                  const state = getState(resolveSignal.id);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        updateState(resolveSignal.id, {
                          [key]: !state[key],
                        })
                      }
                      className={clsx(
                        "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all w-full text-left",
                        state[key]
                          ? "bg-success/8 border border-success/20"
                          : "bg-surface-secondary border border-transparent",
                      )}
                    >
                      <div
                        className={clsx(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                          state[key]
                            ? "bg-success border-success"
                            : "border-input-border",
                        )}
                      >
                        {state[key] && (
                          <CheckCircle
                            size={14}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <Icon
                        size={18}
                        className={state[key] ? "text-success" : "text-text-light"}
                      />
                      <span className="text-sm text-text-main">{label}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                value={getState(resolveSignal.id).notes}
                onChange={(e) =>
                  updateState(resolveSignal.id, { notes: e.target.value })
                }
                rows={3}
                placeholder={t.psychologist.resolveNotesPlaceholder}
                className="w-full px-4 py-3 rounded-2xl border border-input-border bg-surface-secondary text-sm
                  text-text-main placeholder:text-text-light resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />

              <button
                onClick={() =>
                  resolveMutation.mutate({
                    id: resolveSignal.id,
                    data: getState(resolveSignal.id),
                  })
                }
                disabled={resolveMutation.isPending}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-success text-white text-[15px]
                  font-bold hover:bg-success/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors btn-press"
              >
                {resolveMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                {t.psychologist.resolveSignal}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
