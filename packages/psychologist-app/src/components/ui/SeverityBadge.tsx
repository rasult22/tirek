import { clsx } from "clsx";
import { useT } from "../../hooks/useLanguage.js";
import type { Severity } from "@tirek/shared";

interface SeverityBadgeProps {
  severity: Severity | string;
}

const styles: Record<string, { bg: string; text: string }> = {
  minimal: { bg: "bg-success/15", text: "text-success" },
  mild: { bg: "bg-warning/15", text: "text-warning" },
  moderate: { bg: "bg-orange-100", text: "text-orange-600" },
  severe: { bg: "bg-danger/15", text: "text-danger" },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const t = useT();
  const c = styles[severity] ?? styles.minimal;

  const labels: Record<string, string> = {
    minimal: t.severity.minimal,
    mild: t.severity.mild,
    moderate: t.severity.moderate,
    severe: t.severity.severe,
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
        c.bg,
        c.text,
      )}
    >
      {labels[severity] ?? severity}
    </span>
  );
}
