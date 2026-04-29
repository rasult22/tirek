import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clsx } from "clsx";
import { Loader2, ClipboardList, Calendar } from "lucide-react";
import { testDefinitions } from "@tirek/shared";
import {
  listAssignments,
  cancelAssignment,
  type TestAssignmentRow,
  type TestAssignmentStatus,
} from "../../api/diagnostics.js";
import { useT, useLanguage } from "../../hooks/useLanguage.js";

const STATUSES: { key: TestAssignmentStatus; labelKey: keyof Translations }[] = [
  { key: "pending", labelKey: "assignmentStatusPending" },
  { key: "in_progress", labelKey: "assignmentStatusInProgress" },
  { key: "completed", labelKey: "assignmentStatusCompleted" },
  { key: "expired", labelKey: "assignmentStatusExpired" },
  { key: "cancelled", labelKey: "assignmentStatusCancelled" },
];

type Translations = {
  assignmentStatusPending: string;
  assignmentStatusInProgress: string;
  assignmentStatusCompleted: string;
  assignmentStatusExpired: string;
  assignmentStatusCancelled: string;
};

function statusColor(status: TestAssignmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-warning/10 text-warning border-warning/30";
    case "in_progress":
      return "bg-info/15 text-info border-info/40";
    case "completed":
      return "bg-success/15 text-success border-success/30";
    case "expired":
      return "bg-surface-secondary text-text-light border-border";
    case "cancelled":
      return "bg-surface-secondary text-text-light/70 border-border line-through";
  }
}

export function AssignmentsSegment() {
  const t = useT();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TestAssignmentStatus | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["diagnostics", "assignments", { status: statusFilter }],
    queryFn: () =>
      listAssignments(statusFilter ? { status: statusFilter } : undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAssignment(id),
    onSuccess: () => {
      toast.success(t.psychologist.cancelAssignmentSuccess);
      queryClient.invalidateQueries({
        queryKey: ["diagnostics", "assignments"],
      });
    },
    onError: (err: Error) => toast.error(err.message || t.common.actionFailed),
  });

  function testNameForRow(row: TestAssignmentRow): string {
    const slug = row.testSlug;
    if (slug && slug in testDefinitions) {
      const td = testDefinitions[slug as keyof typeof testDefinitions];
      return language === "kz" ? td.nameKz : td.nameRu;
    }
    return row.testName ?? row.testId;
  }

  function targetLabel(row: TestAssignmentRow): string {
    if (row.targetType === "student") {
      return row.studentName ?? "—";
    }
    return `${row.targetGrade ?? "?"}${row.targetClassLetter ?? ""}`;
  }

  function handleCancel(id: string) {
    if (!window.confirm(t.psychologist.cancelAssignmentConfirm)) return;
    cancelMutation.mutate(id);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0",
              statusFilter === null
                ? "bg-primary text-white"
                : "bg-surface-secondary text-text-light hover:bg-surface-hover",
            )}
          >
            {t.psychologist.codeAny}
          </button>
          {STATUSES.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === key ? null : key))
              }
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0",
                statusFilter === key
                  ? "bg-primary text-white"
                  : "bg-surface-secondary text-text-light hover:bg-surface-hover",
              )}
            >
              {(t.psychologist as unknown as Translations)[labelKey]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-light" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <ClipboardList size={36} className="text-text-light mb-2" />
          <p className="text-sm text-text-light">
            {t.psychologist.assignmentsEmpty}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => {
            const canCancel =
              row.status === "pending" || row.status === "in_progress";
            return (
              <li
                key={row.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-main truncate">
                      {targetLabel(row)}
                    </span>
                    <span
                      className={clsx(
                        "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        statusColor(row.status),
                      )}
                    >
                      {(t.psychologist as unknown as Translations)[
                        STATUSES.find((s) => s.key === row.status)?.labelKey ??
                          "assignmentStatusPending"
                      ]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-text-light truncate">
                    {testNameForRow(row)}
                  </div>
                  {row.dueDate && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-light">
                      <Calendar size={10} />
                      {t.psychologist.assignmentDueDate}:{" "}
                      {new Date(row.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {row.studentMessage && (
                    <div className="mt-1.5 px-2 py-1 rounded-md bg-surface-secondary text-[11px] text-text-main">
                      “{row.studentMessage}”
                    </div>
                  )}
                </div>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => handleCancel(row.id)}
                    disabled={cancelMutation.isPending}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-light hover:bg-surface-hover disabled:opacity-50"
                  >
                    {t.psychologist.cancelAssignment}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
