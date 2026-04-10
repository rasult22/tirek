import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { directChatApi } from "../api/direct-chat.js";
import { useT } from "../hooks/useLanguage.js";
import { getActive, getHistory, resolve, getFlaggedMessages } from "../api/crisis.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
  Users,
  FileText,
  Shield,
  History,
  MessageSquareWarning,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { clsx } from "clsx";
import type { SOSEvent, FlaggedMessage } from "@tirek/shared";

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

  const [tab, setTab] = useState<"active" | "flagged" | "history">("active");
  const [resolveStates, setResolveStates] = useState<
    Record<string, ResolveState>
  >({});
  const [openingChat, setOpeningChat] = useState<string | null>(null);

  const openStudentChat = useCallback(async (studentId: string) => {
    setOpeningChat(studentId);
    try {
      const conv = await directChatApi.createConversation(studentId);
      navigate(`/messages/${conv.id}`);
    } catch {
      setOpeningChat(null);
    }
  }, [navigate]);

  const { data: active, isLoading: activeLoading } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: getActive,
    refetchInterval: 15_000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: getHistory,
  });

  const { data: flagged, isLoading: flaggedLoading } = useQuery({
    queryKey: ["crisis", "flagged"],
    queryFn: getFlaggedMessages,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveState }) =>
      resolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crisis"] });
    },
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
    if (minutes < 1) return "<1m ago";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function levelColor(level: number) {
    if (level >= 3) return "bg-danger text-white";
    if (level >= 2) return "bg-warning text-white";
    return "bg-yellow-400 text-white";
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-main">
        {t.psychologist.crisis}
      </h1>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 bg-surface-secondary p-1 rounded-lg min-w-max">
          <button
            onClick={() => setTab("active")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              tab === "active" ? "bg-surface text-text-main shadow-sm" : "text-text-light hover:text-text-main",
            )}
          >
            <AlertTriangle size={13} />
            {t.psychologist.activeAlerts}
            {(active?.data?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-danger text-white">
                {active!.data.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("flagged")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              tab === "flagged" ? "bg-surface text-text-main shadow-sm" : "text-text-light hover:text-text-main",
            )}
          >
            <MessageSquareWarning size={13} />
            {t.psychologist.flaggedMessages}
            {(flagged?.data?.length ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-warning text-white">
                {flagged!.data.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              tab === "history" ? "bg-surface text-text-main shadow-sm" : "text-text-light hover:text-text-main",
            )}
          >
            <History size={13} />
            {t.psychologist.resolvedHistory}
          </button>
        </div>
      </div>

      {/* Active alerts */}
      {tab === "active" && <section>
        {activeLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-text-light" />
          </div>
        ) : active && active.data.length > 0 ? (
          <div className="space-y-3">
            {active.data.map((alert: SOSEvent) => {
              const state = getState(alert.id);
              return (
                <div
                  key={alert.id}
                  className="bg-surface rounded-xl border-2 border-danger/30 shadow-sm overflow-hidden"
                >
                  {/* Alert header */}
                  <div className="bg-danger/5 px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-text-main">
                          {alert.studentName ?? "Student"}
                        </h3>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                            levelColor(alert.level),
                          )}
                        >
                          L{alert.level}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-0.5">
                        {alert.studentGrade
                          ? `${alert.studentGrade}${alert.studentClassLetter ?? ""}`
                          : ""}{" "}
                        &middot;{" "}
                        <Clock size={10} className="inline" />{" "}
                        {formatTimeAgo(alert.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {alert.notes && (
                    <div className="px-4 py-2.5 border-t border-danger/10 bg-danger/3">
                      <p className="text-xs text-text-main leading-relaxed">
                        {alert.notes}
                      </p>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="px-4 py-2.5 border-t border-danger/10 flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/students/${alert.userId}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Users size={12} />
                      Профиль
                    </button>
                    <button
                      onClick={() => openStudentChat(alert.userId)}
                      disabled={openingChat === alert.userId}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-success/10 text-success hover:bg-success/20 disabled:opacity-50 transition-colors"
                    >
                      {openingChat === alert.userId ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <MessageCircle size={12} />
                      )}
                      Написать
                    </button>
                  </div>

                  {/* Action checklist */}
                  <div className="px-4 py-3 border-t border-danger/10">
                    <h4 className="text-xs font-semibold text-text-main mb-2">
                      {t.psychologist.actionChecklist}
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.contactedStudent}
                          onChange={(e) =>
                            updateState(alert.id, {
                              contactedStudent: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-input-border text-primary focus:ring-primary/30"
                        />
                        <Phone size={13} className="text-text-light" />
                        <span className="text-xs text-text-main">
                          {t.psychologist.contactStudent}
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.contactedParent}
                          onChange={(e) =>
                            updateState(alert.id, {
                              contactedParent: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-input-border text-primary focus:ring-primary/30"
                        />
                        <Users size={13} className="text-text-light" />
                        <span className="text-xs text-text-main">
                          {t.psychologist.contactParent}
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.documented}
                          onChange={(e) =>
                            updateState(alert.id, {
                              documented: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-input-border text-primary focus:ring-primary/30"
                        />
                        <FileText size={13} className="text-text-light" />
                        <span className="text-xs text-text-main">
                          {t.psychologist.documentActions}
                        </span>
                      </label>
                    </div>

                    <textarea
                      value={state.notes}
                      onChange={(e) =>
                        updateState(alert.id, { notes: e.target.value })
                      }
                      rows={2}
                      placeholder="Опишите предпринятые действия..."
                      className="mt-3 w-full px-3 py-2 rounded-lg border border-input-border bg-surface text-xs
                        text-text-main placeholder:text-text-light resize-none
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />

                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() =>
                          resolveMutation.mutate({
                            id: alert.id,
                            data: state,
                          })
                        }
                        disabled={
                          !state.notes.trim() || resolveMutation.isPending
                        }
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success text-white text-xs
                          font-semibold hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        {t.psychologist.resolve}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Shield size={20} className="text-success" />
            </div>
            <p className="text-sm font-medium text-text-main">
              Нет активных кризисных алертов
            </p>
            <p className="text-xs text-text-light mt-0.5">
              Все ученики в безопасности
            </p>
          </div>
        )}
      </section>}

      {/* Flagged messages */}
      {tab === "flagged" && <section>
        {flaggedLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-text-light" />
          </div>
        ) : flagged && flagged.data.length > 0 ? (
          <div className="space-y-2">
            {flagged.data.map((msg: FlaggedMessage) => (
              <div key={msg.messageId} className="bg-surface rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning size={14} className="text-warning" />
                    <span className="text-sm font-semibold text-text-main">
                      {msg.studentName}
                    </span>
                    {msg.studentGrade && (
                      <span className="text-xs text-text-light">
                        {msg.studentGrade}{msg.studentClass ?? ""}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-main bg-warning/5 rounded-lg p-2.5 border border-warning/20">
                  {msg.content}
                </p>
                <p className="text-[10px] text-text-light mt-1.5">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Shield size={20} className="text-success" />
            </div>
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        )}
      </section>}

      {/* History */}
      {tab === "history" && <section>
        {historyLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-text-light" />
          </div>
        ) : history && history.data.length > 0 ? (
          <div className="space-y-2">
            {history.data.map((event: SOSEvent) => (
              <div
                key={event.id}
                className="flex items-center gap-3 bg-surface rounded-xl border border-border shadow-sm p-3"
              >
                <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                  <CheckCircle size={14} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {event.studentName ?? "Student"}
                    <span
                      className={clsx(
                        "ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full",
                        levelColor(event.level),
                      )}
                    >
                      L{event.level}
                    </span>
                  </p>
                  {event.notes && (
                    <p className="text-xs text-text-light mt-0.5 truncate">
                      {event.notes}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-text-light">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                  {event.resolvedAt && (
                    <p className="text-[9px] text-success">
                      Resolved{" "}
                      {new Date(event.resolvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        )}
      </section>}
    </div>
  );
}
