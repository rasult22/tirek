import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
import { getActive, getHistory, resolve } from "../api/crisis.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
  Users,
  FileText,
  Send,
  Shield,
  History,
} from "lucide-react";
import { clsx } from "clsx";
import type { SOSEvent } from "@tirek/shared";

interface ResolveState {
  notes: string;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
}

export function CrisisPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const [resolveStates, setResolveStates] = useState<
    Record<string, ResolveState>
  >({});

  const { data: active, isLoading: activeLoading } = useQuery({
    queryKey: ["crisis", "active"],
    queryFn: getActive,
    refetchInterval: 15_000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: getHistory,
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-main">
        {t.psychologist.crisis}
      </h1>

      {/* Active alerts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-danger" />
          <h2 className="text-lg font-semibold text-text-main">
            Active Alerts
          </h2>
          {(active?.data?.length ?? 0) > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-danger text-white">
              {active!.data.length}
            </span>
          )}
        </div>

        {activeLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-text-light" />
          </div>
        ) : active && active.data.length > 0 ? (
          <div className="space-y-4">
            {active.data.map((alert: SOSEvent) => {
              const state = getState(alert.id);
              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border-2 border-danger/30 shadow-sm overflow-hidden"
                >
                  {/* Alert header */}
                  <div className="bg-danger/5 px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                      <AlertTriangle size={22} className="text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-semibold text-text-main">
                          {alert.studentName ?? "Student"}
                        </h3>
                        <span
                          className={clsx(
                            "px-2 py-0.5 text-xs font-bold rounded-full",
                            levelColor(alert.level),
                          )}
                        >
                          {t.psychologist.crisisLevel} {alert.level}
                        </span>
                      </div>
                      <p className="text-sm text-text-light">
                        {alert.studentGrade
                          ? `${alert.studentGrade}${alert.studentClass ?? ""} class`
                          : ""}{" "}
                        &middot;{" "}
                        <Clock size={12} className="inline" />{" "}
                        {formatTimeAgo(alert.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status="crisis" />
                  </div>

                  {/* Action checklist */}
                  <div className="px-5 py-4 border-t border-danger/10">
                    <h4 className="text-sm font-semibold text-text-main mb-3">
                      {t.psychologist.actionChecklist}
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.contactedStudent}
                          onChange={(e) =>
                            updateState(alert.id, {
                              contactedStudent: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                        />
                        <Phone size={14} className="text-text-light" />
                        <span className="text-sm text-text-main">
                          {t.psychologist.contactStudent}
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.contactedParent}
                          onChange={(e) =>
                            updateState(alert.id, {
                              contactedParent: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                        />
                        <Users size={14} className="text-text-light" />
                        <span className="text-sm text-text-main">
                          {t.psychologist.contactParent}
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.documented}
                          onChange={(e) =>
                            updateState(alert.id, {
                              documented: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                        />
                        <FileText size={14} className="text-text-light" />
                        <span className="text-sm text-text-main">
                          {t.psychologist.documentActions}
                        </span>
                      </label>
                    </div>

                    {/* Resolution notes */}
                    <div className="mt-4">
                      <textarea
                        value={state.notes}
                        onChange={(e) =>
                          updateState(alert.id, { notes: e.target.value })
                        }
                        rows={3}
                        placeholder="Resolution notes..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                          text-text-main placeholder:text-text-light resize-none
                          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    <div className="flex justify-end mt-3">
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
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success text-white text-sm
                          font-semibold hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-success" />
            </div>
            <p className="text-sm font-medium text-text-main">
              No active crisis alerts
            </p>
            <p className="text-xs text-text-light mt-1">
              All students are safe
            </p>
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-text-light" />
          <h2 className="text-lg font-semibold text-text-main">
            Resolved History
          </h2>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-text-light" />
          </div>
        ) : history && history.data.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {history.data.map((event: SOSEvent) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main">
                      {event.studentName ?? "Student"}
                      <span
                        className={clsx(
                          "ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full",
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
                    <p className="text-xs text-text-light">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                    {event.resolvedAt && (
                      <p className="text-[10px] text-success">
                        Resolved{" "}
                        {new Date(event.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        )}
      </section>
    </div>
  );
}
