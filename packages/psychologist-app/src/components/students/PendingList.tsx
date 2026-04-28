import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2, Check, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import type { InviteCode } from "@tirek/shared";
import { useT } from "../../hooks/useLanguage.js";
import { list, revoke } from "../../api/inviteCodes.js";
import { ConfirmDialog } from "../ui/ConfirmDialog.js";
import { ErrorState } from "../ui/ErrorState.js";

function getCodeStatus(code: InviteCode): "available" | "used" | "expired" {
  if (code.usedBy) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

interface PendingListProps {
  onGenerateNew: (prefill: { name: string; grade: number | null; classLetter: string | null }) => void;
}

export function PendingList({ onGenerateNew }: PendingListProps) {
  const t = useT();
  const queryClient = useQueryClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: codes, isLoading, isError, refetch } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: list,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  async function copyCode(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success(t.common.copied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-text-light" />
      </div>
    );
  }

  const visible = (codes?.data ?? []).filter((c) => {
    const s = getCodeStatus(c);
    return s === "available" || s === "expired";
  });

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <KeyRound size={36} className="text-text-light mb-2" />
        <p className="text-sm text-text-light">{t.psychologist.pendingEmpty}</p>
      </div>
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
      <div className="space-y-2">
        {visible.map((code) => {
          const status = getCodeStatus(code);
          const isExpired = status === "expired";
          return (
            <div
              key={code.id}
              className="bg-surface rounded-xl border border-border shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <code className="text-sm font-mono font-medium text-text-main bg-surface-secondary px-2 py-1 rounded self-start">
                    {code.code}
                  </code>
                  <div className="text-xs font-medium text-text-main truncate">
                    {code.studentRealName}
                  </div>
                </div>
                <span
                  className={clsx(
                    "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap",
                    isExpired
                      ? "bg-text-light/15 text-text-light"
                      : "bg-success/15 text-success",
                  )}
                >
                  {isExpired
                    ? t.psychologist.codeExpired
                    : t.psychologist.codeAvailable}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-text-light">
                  {code.grade ? `${code.grade}${code.classLetter ?? ""}` : "—"}
                  {!isExpired && (
                    <>
                      {" · "}
                      {t.psychologist.expiresInDays.replace(
                        "{days}",
                        String(daysUntil(code.expiresAt)),
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isExpired ? (
                    <button
                      onClick={() =>
                        onGenerateNew({
                          name: code.studentRealName ?? "",
                          grade: code.grade ?? null,
                          classLetter: code.classLetter ?? null,
                        })
                      }
                      className="btn-press flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                    >
                      <RefreshCw size={12} />
                      {t.psychologist.generateNewCode}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => copyCode(code.code, code.id)}
                        aria-label={t.common.copied}
                        className="p-1.5 rounded-md hover:bg-surface-hover text-text-light hover:text-primary transition-colors"
                      >
                        {copiedId === code.id ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setRevokeId(code.id)}
                        disabled={revokeMutation.isPending}
                        aria-label={t.common.delete}
                        className="p-1.5 rounded-md hover:bg-danger/10 text-text-light hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
