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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface shadow-xl animate-fade-in-up flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-light">
          <h3 className="text-lg font-bold text-text-main">
            {t.psychologist.filtersTitle}
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
          <FilterSection label={t.psychologist.filtersTest}>
            <Chip
              active={testSlug === ""}
              onClick={() => setTestSlug("")}
              label={t.psychologist.codeAny}
            />
            {tests.map((td) => (
              <Chip
                key={td.slug}
                active={testSlug === td.slug}
                onClick={() =>
                  setTestSlug(testSlug === td.slug ? "" : td.slug)
                }
                label={language === "kz" ? td.nameKz : td.nameRu}
              />
            ))}
          </FilterSection>

          <FilterSection label={t.psychologist.filtersSeverity}>
            <Chip
              active={severity === ""}
              onClick={() => setSeverity("")}
              label={t.psychologist.codeAny}
            />
            {SEVERITIES.map((s) => (
              <Chip
                key={s}
                active={severity === s}
                onClick={() => setSeverity(severity === s ? "" : s)}
                label={s}
              />
            ))}
          </FilterSection>

          <FilterSection label={t.psychologist.filtersGrade}>
            <Chip
              active={grade === ""}
              onClick={() => setGrade("")}
              label={t.psychologist.codeAny}
            />
            {GRADES.map((g) => (
              <Chip
                key={g}
                active={grade === String(g)}
                onClick={() => setGrade(grade === String(g) ? "" : String(g))}
                label={String(g)}
              />
            ))}
          </FilterSection>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
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
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
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
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-border-light">
          <button
            type="button"
            onClick={reset}
            className="flex-1 h-11 rounded-xl border border-border-light text-sm font-semibold text-text-light hover:bg-surface-hover"
          >
            {t.psychologist.filtersReset}
          </button>
          <button
            type="button"
            onClick={apply}
            className="btn-press flex-[2] h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
          >
            {t.psychologist.filtersApply}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-light mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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
