import { clsx } from "clsx";
import { AlertTriangle } from "lucide-react";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { formatRiskReason } from "@tirek/shared";
import type { RiskReason } from "@tirek/shared/api";
import type { User } from "@tirek/shared";

interface StudentDetailHeroProps {
  student: User;
  status: "normal" | "attention" | "crisis";
  reason: RiskReason | null;
}

const statusDotColor: Record<string, string> = {
  normal: "bg-success",
  attention: "bg-warning",
  crisis: "bg-danger",
};

export function StudentDetailHero({ student, status, reason }: StudentDetailHeroProps) {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;
  const reasonText = status !== "normal" ? formatRiskReason({ reason, t, language }) : null;

  const classLabel =
    student.grade != null
      ? `${student.grade}${student.classLetter ?? ""} ${d.class}`
      : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-light bg-surface p-5">
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "w-16 h-16 rounded-full bg-brand-soft text-brand-deep flex items-center justify-center text-2xl font-bold shrink-0",
            status === "crisis" && "animate-pulse-border",
          )}
        >
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-text-main truncate">
              {student.name}
            </h1>
            <span
              className={clsx(
                "inline-block w-2 h-2 rounded-full",
                statusDotColor[status],
                status === "crisis" && "animate-pulse-border",
              )}
              aria-label={`status: ${status}`}
            />
            <StatusBadge status={status} size="sm" />
          </div>
          <p className="text-sm text-text-light mt-1 truncate">
            {classLabel}
            {classLabel && student.email ? " · " : ""}
            {student.email}
          </p>
          {reasonText && (
            <p
              className={clsx(
                "flex items-center gap-1.5 text-xs font-medium mt-2",
                status === "crisis" ? "text-danger" : "text-warning",
              )}
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span className="truncate">{reasonText}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
