import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import { generate } from "../../api/inviteCodes.js";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export interface GenerateCodesPrefill {
  name: string;
  grade: number | null;
  classLetter: string | null;
}

interface GenerateCodesSheetProps {
  open: boolean;
  prefill: GenerateCodesPrefill | null;
  onClose: () => void;
  onSuccess: () => void;
}

function parseStudentNames(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function GenerateCodesSheet({
  open,
  prefill,
  onClose,
  onSuccess,
}: GenerateCodesSheetProps) {
  const t = useT();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [namesText, setNamesText] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNamesText(prefill?.name ?? "");
      setGrade(prefill?.grade ?? null);
      setClassLetter(prefill?.classLetter ?? null);
    }
  }, [open, prefill]);

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
        grade: grade ?? undefined,
        classLetter: classLetter ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message || t.common.actionFailed),
  });

  if (!open) return null;

  const canSubmit =
    !generateMutation.isPending &&
    studentNames.length >= 1 &&
    studentNames.length <= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface shadow-xl animate-fade-in-up flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-light">
          <h3 className="text-lg font-bold text-text-main">
            {t.psychologist.generateCodes}
          </h3>
          <button
            onClick={onClose}
            aria-label={t.common.cancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-secondary hover:bg-surface-hover text-text-light"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
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
            <p className="text-[11px] text-text-light mt-1 tabular-nums">
              {studentNames.length} / 100
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
              {t.auth.selectGrade}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={grade === null}
                onClick={() => setGrade(null)}
                label={t.psychologist.codeAny}
              />
              {GRADES.map((g) => (
                <Chip
                  key={g}
                  active={grade === g}
                  onClick={() => setGrade(grade === g ? null : g)}
                  label={`${g} ${language === "kz" ? "сынып" : "класс"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
              {t.auth.selectClass}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={classLetter === null}
                onClick={() => setClassLetter(null)}
                label={t.psychologist.codeAny}
              />
              {CLASS_LETTERS.map((l) => (
                <Chip
                  key={l}
                  active={classLetter === l}
                  onClick={() => setClassLetter(classLetter === l ? null : l)}
                  label={l}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-light">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={!canSubmit}
            className="btn-press w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {generateMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {t.psychologist.generate}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
        active
          ? "bg-brand-soft text-brand-deep border-brand/30"
          : "bg-surface-secondary text-text-light border-border-light hover:bg-surface-hover",
      )}
    >
      {label}
    </button>
  );
}
