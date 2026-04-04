import { clsx } from "clsx";
import type { Severity } from "@tirek/shared";

interface SeverityBadgeProps {
  severity: Severity | string;
}

const config: Record<string, { bg: string; text: string; label: string }> = {
  minimal: { bg: "bg-success/15", text: "text-success", label: "Minimal" },
  mild: { bg: "bg-warning/15", text: "text-warning", label: "Mild" },
  moderate: { bg: "bg-orange-100", text: "text-orange-600", label: "Moderate" },
  severe: { bg: "bg-danger/15", text: "text-danger", label: "Severe" },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const c = config[severity] ?? config.minimal;

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
        c.bg,
        c.text,
      )}
    >
      {severity}
    </span>
  );
}
