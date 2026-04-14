import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { directChatApi } from "../api/direct-chat.js";
import { useT } from "../hooks/useLanguage.js";
import {
  getActive,
  getHistory,
  resolve,
  getFlaggedMessages,
} from "../api/crisis.js";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
  Users,
  FileText,
  Shield,
  MessageSquareWarning,
  MessageCircle,
  ChevronDown,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { clsx } from "clsx";
import { toast } from "sonner";
import type { SOSEvent, FlaggedMessage } from "@tirek/shared";
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

  const [resolveStates, setResolveStates] = useState<
    Record<string, ResolveState>
  >({});
  const [resolveSheetId, setResolveSheetId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
    data: active,
    isLoading: activeLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: getActive,
    refetchInterval: 15_000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: getHistory,
    enabled: historyOpen,
  });

  const { data: flagged, isLoading: flaggedLoading } = useQuery({
    queryKey: ["crisis", "flagged"],
    queryFn: getFlaggedMessages,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveState }) =>
      resolve(id, data),
    onSuccess: () => {
      setResolveSheetId(null);
      queryClient.invalidateQueries({ queryKey: ["crisis"] });
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

  const activeAlerts = active?.data ?? [];
  const flaggedMsgs = flagged?.data ?? [];
  const historyEvents = history?.data ?? [];

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  // The alert that's being resolved (for the bottom sheet)
  const resolveAlert = resolveSheetId
    ? activeAlerts.find((a: SOSEvent) => a.id === resolveSheetId)
    : null;

  return (
    <>
      <div className="space-y-5 animate-fade-in-up">
        {/* Page title */}
        <h1 className="text-xl font-bold tracking-tight text-text-main">
          {t.psychologist.crisis}
        </h1>

        {/* ── ACTIVE ALERTS ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
              <AlertTriangle size={14} className="text-danger" />
            </div>
            <h2 className="text-sm font-bold text-text-main">
              {t.psychologist.activeAlerts}
            </h2>
            {activeAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-danger text-white">
                {activeAlerts.length}
              </span>
            )}
          </div>

          {activeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-text-light" />
            </div>
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-2.5 stagger-children">
              {activeAlerts.map((alert: SOSEvent) => (
                <div
                  key={alert.id}
                  className={clsx(
                    "glass-card rounded-2xl overflow-hidden",
                    alert.level >= 3 && "animate-pulse-border !border-danger",
                  )}
                >
                  {/* Top: red accent bar for L3 */}
                  {alert.level >= 3 && (
                    <div className="h-1 bg-gradient-to-r from-danger via-danger/70 to-danger" />
                  )}

                  <div className="p-4">
                    {/* Name + level + time */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0 text-sm font-bold text-danger">
                        {(alert.studentName ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-text-main truncate">
                          {alert.studentName ?? t.psychologist.student}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-text-light">
                          {alert.studentGrade && (
                            <>
                              <span>
                                {alert.studentGrade}
                                {alert.studentClassLetter ?? ""}
                              </span>
                              <span className="opacity-30">&middot;</span>
                            </>
                          )}
                          <Clock size={11} />
                          <span>{formatTimeAgo(alert.createdAt)}</span>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold",
                          alert.level >= 3 && "bg-danger text-white",
                          alert.level === 2 && "bg-warning text-white",
                          alert.level <= 1 && "bg-yellow-400 text-white",
                        )}
                      >
                        {alert.level}
                      </span>
                    </div>

                    {/* Student note */}
                    {alert.notes && (
                      <div className="mb-3 bg-danger/5 rounded-xl px-3 py-2.5 border border-danger/10">
                        <p className="text-[13px] text-text-main leading-relaxed">
                          {alert.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions: 3 buttons in a row */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => navigate(`/students/${alert.userId}`)}
                        className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary active:bg-surface-hover transition-colors"
                      >
                        <Users size={16} className="text-primary" />
                        <span className="text-[11px] font-medium text-text-main">
                          {t.psychologist.profile}
                        </span>
                      </button>
                      <button
                        onClick={() => openStudentChat(alert.userId)}
                        disabled={openingChat === alert.userId}
                        className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary active:bg-surface-hover disabled:opacity-50 transition-colors"
                      >
                        {openingChat === alert.userId ? (
                          <Loader2 size={16} className="animate-spin text-success" />
                        ) : (
                          <MessageCircle size={16} className="text-success" />
                        )}
                        <span className="text-[11px] font-medium text-text-main">
                          {t.psychologist.writeMessage}
                        </span>
                      </button>
                      <button
                        onClick={() => setResolveSheetId(alert.id)}
                        className="btn-press flex flex-col items-center gap-1 py-2.5 rounded-xl bg-surface-secondary active:bg-surface-hover transition-colors"
                      >
                        <CheckCircle size={16} className="text-text-light" />
                        <span className="text-[11px] font-medium text-text-main">
                          {t.psychologist.resolve}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <Shield size={24} className="text-success" />
              </div>
              <p className="text-[15px] font-semibold text-text-main">
                {t.psychologist.noActiveAlerts}
              </p>
              <p className="text-xs text-text-light mt-1">
                {t.psychologist.allStudentsSafe}
              </p>
            </div>
          )}
        </section>

        {/* ── FLAGGED MESSAGES ── */}
        {!flaggedLoading && flaggedMsgs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                <MessageSquareWarning size={14} className="text-warning" />
              </div>
              <h2 className="text-sm font-bold text-text-main">
                {t.psychologist.flaggedMessages}
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-warning text-white">
                {flaggedMsgs.length}
              </span>
            </div>

            <div className="space-y-2 stagger-children">
              {flaggedMsgs.map((msg: FlaggedMessage) => (
                <button
                  key={msg.messageId}
                  onClick={() => {
                    if (msg.sessionId) navigate(`/messages/${msg.sessionId}`);
                  }}
                  className="btn-press w-full glass-card rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0 text-lg">
                      &#9888;&#65039;
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-text-main truncate">
                            {msg.studentName}
                          </span>
                          {msg.studentGrade && (
                            <span className="text-xs text-text-light shrink-0">
                              {msg.studentGrade}
                              {msg.studentClass ?? ""}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-light shrink-0">
                          {formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-[13px] text-text-main mt-1.5 line-clamp-2 leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.sosEventId && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/8 text-[10px] font-bold text-danger">
                          <AlertTriangle size={10} />
                          {t.psychologist.linkedAlert}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── RESOLVED HISTORY ── */}
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
              ) : historyEvents.length > 0 ? (
                <div className="space-y-1.5 stagger-children">
                  {historyEvents.map((event: SOSEvent) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
                        <CheckCircle size={14} className="text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-main truncate">
                          {event.studentName ?? t.psychologist.student}
                        </p>
                        {event.notes && (
                          <p className="text-xs text-text-light truncate mt-0.5">
                            {event.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded-md",
                            event.level >= 3 && "bg-danger/10 text-danger",
                            event.level === 2 && "bg-warning/10 text-warning",
                            event.level <= 1 &&
                              "bg-yellow-400/10 text-yellow-600",
                          )}
                        >
                          L{event.level}
                        </span>
                        {event.resolvedAt && (
                          <p className="text-[10px] text-text-light mt-1">
                            {new Date(event.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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

      {/* ── RESOLVE BOTTOM SHEET ── */}
      {resolveAlert && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setResolveSheetId(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative bg-surface rounded-t-3xl max-h-[85dvh] overflow-y-auto safe-bottom animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-6">
              {/* Sheet header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-sm font-bold text-danger">
                    {(resolveAlert.studentName ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-text-main">
                      {resolveAlert.studentName ?? t.psychologist.student}
                    </p>
                    <p className="text-xs text-text-light">
                      {t.psychologist.resolve}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResolveSheetId(null)}
                  className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center"
                >
                  <X size={16} className="text-text-light" />
                </button>
              </div>

              {/* Checklist */}
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
                  const state = getState(resolveAlert.id);
                  return (
                    <label
                      key={key}
                      className={clsx(
                        "flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all",
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
                        className={
                          state[key] ? "text-success" : "text-text-light"
                        }
                      />
                      <span
                        className={clsx(
                          "text-sm",
                          state[key]
                            ? "text-text-main font-medium"
                            : "text-text-main",
                        )}
                      >
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Notes */}
              <textarea
                value={getState(resolveAlert.id).notes}
                onChange={(e) =>
                  updateState(resolveAlert.id, { notes: e.target.value })
                }
                rows={3}
                placeholder={t.psychologist.resolveNotesPlaceholder}
                className="w-full px-4 py-3 rounded-2xl border border-input-border bg-surface-secondary text-sm
                  text-text-main placeholder:text-text-light resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />

              {/* Submit */}
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    id: resolveAlert.id,
                    data: getState(resolveAlert.id),
                  })
                }
                disabled={
                  !getState(resolveAlert.id).notes.trim() ||
                  resolveMutation.isPending
                }
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-success text-white text-[15px]
                  font-bold active:bg-success/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors btn-press"
              >
                {resolveMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                {t.psychologist.resolve}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
