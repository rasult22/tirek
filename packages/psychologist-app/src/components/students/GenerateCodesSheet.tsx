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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-t-2xl px-5 pt-2 pb-6 max-h-[90dvh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-border-light" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-text-main">
            {t.psychologist.generateCodes}
          </h3>
          <button
            onClick={onClose}
            aria-label={t.common.cancel}
            className="p-1.5 rounded-md hover:bg-surface-hover text-text-light"
          >
            <X size={18} />
          </button>
        </div>

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

          <div>
            <label className="block text-xs font-medium text-text-main mb-1">
              {t.auth.selectGrade}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGrade(null)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  grade === null
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                )}
              >
                {t.psychologist.codeAny}
              </button>
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(grade === g ? null : g)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    grade === g
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                  )}
                >
                  {g} {language === "kz" ? "сынып" : "класс"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main mb-1">
              {t.auth.selectClass}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setClassLetter(null)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  classLetter === null
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                )}
              >
                {t.psychologist.codeAny}
              </button>
              {CLASS_LETTERS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    setClassLetter(classLetter === l ? null : l)
                  }
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    classLetter === l
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={
              generateMutation.isPending ||
              studentNames.length < 1 ||
              studentNames.length > 100
            }
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
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
