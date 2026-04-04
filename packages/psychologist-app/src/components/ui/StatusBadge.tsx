import { useT } from "../../hooks/useLanguage.js";
import { clsx } from "clsx";

interface StatusBadgeProps {
  status: "normal" | "attention" | "crisis";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const t = useT();

  const labels: Record<string, string> = {
    normal: t.psychologist.statusNormal,
    attention: t.psychologist.statusAttention,
    crisis: t.psychologist.statusCrisis,
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        status === "normal" && "bg-success/15 text-success",
        status === "attention" && "bg-warning/15 text-warning",
        status === "crisis" && "bg-danger/15 text-danger",
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          status === "normal" && "bg-success",
          status === "attention" && "bg-warning",
          status === "crisis" && "bg-danger",
        )}
      />
      {labels[status] ?? status}
    </span>
  );
}
