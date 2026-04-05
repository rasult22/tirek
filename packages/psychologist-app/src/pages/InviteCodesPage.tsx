import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
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
import type { InviteCode } from "@tirek/shared";

function getCodeStatus(
  code: InviteCode,
): "available" | "used" | "expired" {
  if (code.usedBy) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

export function InviteCodesPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [count, setCount] = useState(5);
  const [grade, setGrade] = useState("");
  const [classLetter, setClassLetter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: codes, isLoading } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: list,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generate({
        count,
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      setShowForm(false);
      setCount(5);
      setGrade("");
      setClassLetter("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
  });

  async function copyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">
          {t.psychologist.inviteCodes}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm
            font-semibold hover:bg-primary-dark transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t.common.cancel : t.psychologist.generateCodes}
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="text-base font-semibold text-text-main mb-4">
            {t.psychologist.generateCodes}
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                Count (1-50)
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                  )
                }
                min={1}
                max={50}
                className="w-24 h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                {t.auth.selectGrade}
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="h-10 px-3 pr-8 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                {t.auth.selectClass}
              </label>
              <select
                value={classLetter}
                onChange={(e) => setClassLetter(e.target.value)}
                className="h-10 px-3 pr-8 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
              >
                <option value="">Any</option>
                {["A", "B", "C", "D", "E"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm
                font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {generateMutation.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Generate
            </button>
          </div>
          {generateMutation.isError && (
            <p className="text-sm text-danger mt-3">{t.common.error}</p>
          )}
        </div>
      )}

      {/* Codes table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-text-light" />
          </div>
        ) : codes && codes.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-surface-secondary/50">
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Code
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Class
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Created
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-text-light">
                    Used By
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-text-light">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {codes.data.map((code) => {
                  const status = getCodeStatus(code);
                  const sc = statusConfig[status];
                  return (
                    <tr
                      key={code.id}
                      className="border-b border-border-light hover:bg-surface-secondary/50"
                    >
                      <td className="px-5 py-3.5">
                        <code className="text-sm font-mono font-medium text-text-main bg-surface-secondary px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
                            sc.bg,
                            sc.text,
                          )}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-light">
                        {code.grade
                          ? `${code.grade}${code.classLetter ?? ""}`
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 text-text-light">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-text-light">
                        {code.usedBy ?? "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyCode(code.code, code.id)}
                            className="p-1.5 rounded-md hover:bg-surface-hover text-text-light hover:text-primary transition-colors"
                            title="Copy"
                          >
                            {copiedId === code.id ? (
                              <Check size={14} className="text-success" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          {status === "available" && (
                            <button
                              onClick={() => revokeMutation.mutate(code.id)}
                              disabled={revokeMutation.isPending}
                              className="p-1.5 rounded-md hover:bg-danger/10 text-text-light hover:text-danger transition-colors"
                              title={t.common.delete}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-16">
            <KeyRound size={40} className="text-text-light mb-3" />
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
