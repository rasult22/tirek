import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { list, generate, revoke } from "../api/inviteCodes.js";
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import type { InviteCode } from "@tirek/shared";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.js";
import { ErrorState } from "../components/ui/ErrorState.js";

function getCodeStatus(
  code: InviteCode,
): "available" | "used" | "expired" {
  if (code.usedBy) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

function parseStudentNames(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function InviteCodesPage() {
  const t = useT();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [namesText, setNamesText] = useState("");
  const [grade, setGrade] = useState("");
  const [classLetter, setClassLetter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: codes, isLoading, isError, refetch } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: list,
  });

  const studentNames = parseStudentNames(namesText);

  const generateMutation = useMutation({
    mutationFn: () => {
      if (studentNames.length < 1) {
        throw new Error(t.psychologist.namesEmptyError);
      }
      if (studentNames.length > 100) {
        throw new Error(t.psychologist.namesTooManyError);
      }
      return generate({
        studentNames,
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      setShowForm(false);
      setNamesText("");
      setGrade("");
      setClassLetter("");
    },
    onError: (err: Error) => toast.error(err.message || t.common.actionFailed),
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

  const statusConfig = {
    available: {
      label: t.psychologist.codeAvailable,
      bg: "bg-success/15",
      text: "text-success",
    },
    used: {
      label: t.psychologist.codeUsed,
      bg: "bg-secondary/15",
      text: "text-secondary",
    },
    expired: {
      label: t.psychologist.codeExpired,
      bg: "bg-danger/15",
      text: "text-danger",
    },
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.inviteCodes}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs
            font-semibold hover:bg-primary-dark transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? t.common.cancel : t.psychologist.generateCodes}
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-text-main mb-3">
            {t.psychologist.generateCodes}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-main mb-1">
                {t.psychologist.studentNamesLabel}
              </label>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                rows={6}
                placeholder={t.psychologist.studentNamesPlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
              />
              <p className="text-[11px] text-text-light mt-1">
                {studentNames.length} / 100
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">
                  {t.auth.selectGrade}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  <option value="">{t.psychologist.codeAny}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>
                      {g} {language === "kz" ? "сынып" : "класс"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">
                  {t.auth.selectClass}
                </label>
                <select
                  value={classLetter}
                  onChange={(e) => setClassLetter(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  <option value="">{t.psychologist.codeAny}</option>
                  {["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={
                generateMutation.isPending ||
                studentNames.length < 1 ||
                studentNames.length > 100
              }
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-white text-sm
                font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {generateMutation.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              {t.psychologist.generate}
            </button>
          </div>
          {generateMutation.isError && (
            <p className="text-sm text-danger mt-2">{t.common.error}</p>
          )}
        </div>
      )}

      {/* Codes as cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-light" />
        </div>
      ) : codes && codes.data.length > 0 ? (
        <div className="space-y-2">
          {codes.data.map((code) => {
            const status = getCodeStatus(code);
            const sc = statusConfig[status];
            return (
              <div
                key={code.id}
                className="bg-surface rounded-xl border border-border shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
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
                      sc.bg,
                      sc.text,
                    )}
                  >
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-text-light">
                    {code.grade
                      ? `${code.grade}${code.classLetter ?? ""}`
                      : "—"}{" "}
                    &middot;{" "}
                    {new Date(code.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyCode(code.code, code.id)}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-text-light hover:text-primary transition-colors"
                    >
                      {copiedId === code.id ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    {status === "available" && (
                      <button
                        onClick={() => setRevokeId(code.id)}
                        disabled={revokeMutation.isPending}
                        aria-label={t.common.delete}
                        className="p-1.5 rounded-md hover:bg-danger/10 text-text-light hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12">
          <KeyRound size={36} className="text-text-light mb-2" />
          <p className="text-sm text-text-light">{t.common.noData}</p>
        </div>
      )}
    </div>
    </>
  );
}
