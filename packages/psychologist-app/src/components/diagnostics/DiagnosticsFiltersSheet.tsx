import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { testDefinitions } from "@tirek/shared";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import type { DiagnosticsFilters } from "../../api/diagnostics.js";

interface Props {
  open: boolean;
  initial: DiagnosticsFilters;
  onClose: () => void;
  onApply: (filters: DiagnosticsFilters) => void;
}

const SEVERITIES = ["minimal", "mild", "moderate", "severe"] as const;
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function DiagnosticsFiltersSheet({
  open,
  initial,
  onClose,
  onApply,
}: Props) {
  const t = useT();
  const { language } = useLanguage();

  const [testSlug, setTestSlug] = useState<string>(initial.testSlug ?? "");
  const [severity, setSeverity] = useState<string>(
    typeof initial.severity === "string" ? initial.severity : "",
  );
  const [grade, setGrade] = useState<string>(
    initial.grade != null ? String(initial.grade) : "",
  );
  const [from, setFrom] = useState<string>(initial.from ?? "");
  const [to, setTo] = useState<string>(initial.to ?? "");

  useEffect(() => {
    if (open) {
      setTestSlug(initial.testSlug ?? "");
      setSeverity(typeof initial.severity === "string" ? initial.severity : "");
      setGrade(initial.grade != null ? String(initial.grade) : "");
      setFrom(initial.from ?? "");
      setTo(initial.to ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  const tests = Object.values(testDefinitions);

  function apply() {
    onApply({
      testSlug: testSlug || undefined,
      severity: severity || undefined,
      grade: grade ? Number(grade) : undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }

  function reset() {
    setTestSlug("");
    setSeverity("");
    setGrade("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl px-5 pt-2 pb-6 max-h-[90dvh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-border-light" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-text-main">
            {t.psychologist.filtersTitle}
          </h3>
          <button
            onClick={onClose}
            aria-label={t.common.cancel}
            className="p-1.5 rounded-md hover:bg-surface-hover text-text-light"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-main mb-1">
              {t.psychologist.filtersTest}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTestSlug("")}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  testSlug === ""
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                )}
              >
                {t.psychologist.codeAny}
              </button>
              {tests.map((td) => (
                <button
                  key={td.slug}
                  type="button"
                  onClick={() =>
                    setTestSlug(testSlug === td.slug ? "" : td.slug)
                  }
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    testSlug === td.slug
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                  )}
                >
                  {language === "kz" ? td.nameKz : td.nameRu}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main mb-1">
              {t.psychologist.filtersSeverity}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSeverity("")}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  severity === ""
                    ? "bg-primary text-white"
                    : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                )}
              >
                {t.psychologist.codeAny}
              </button>
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(severity === s ? "" : s)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    severity === s
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main mb-1">
              {t.psychologist.filtersGrade}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGrade("")}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  grade === ""
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
                  onClick={() => setGrade(grade === String(g) ? "" : String(g))}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    grade === String(g)
                      ? "bg-primary text-white"
                      : "bg-surface-secondary text-text-light hover:bg-surface-hover",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-text-main mb-1">
                {t.psychologist.filtersDateFrom}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main mb-1">
                {t.psychologist.filtersDateTo}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-text-light hover:bg-surface-hover"
            >
              {t.psychologist.filtersReset}
            </button>
            <button
              type="button"
              onClick={apply}
              className="flex-[2] h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
            >
              {t.psychologist.filtersApply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
