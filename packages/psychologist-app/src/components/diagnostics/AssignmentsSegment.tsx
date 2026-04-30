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
import { DataTable, type DataTableColumn } from "../ui/DataTable.js";

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

  const columns: DataTableColumn<TestAssignmentRow>[] = [
    {
      key: "target",
      header: t.psychologist.assignSelectStudent,
      width: "26%",
      cell: (row) => (
        <span className="font-semibold text-text-main truncate block">
          {targetLabel(row)}
        </span>
      ),
    },
    {
      key: "test",
      header: t.psychologist.diagnostics,
      cell: (row) => (
        <span className="text-text-light text-sm truncate block">
          {testNameForRow(row)}
        </span>
      ),
      hideOnSmall: true,
    },
    {
      key: "status",
      header: "",
      width: "140px",
      cell: (row) => (
        <span
          className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
            statusColor(row.status),
          )}
        >
          {(t.psychologist as unknown as Translations)[
            STATUSES.find((s) => s.key === row.status)?.labelKey ??
              "assignmentStatusPending"
          ]}
        </span>
      ),
    },
    {
      key: "due",
      header: t.psychologist.assignmentDueDate,
      width: "110px",
      hideOnSmall: true,
      cell: (row) =>
        row.dueDate ? (
          <span className="inline-flex items-center gap-1 text-xs text-text-light tabular-nums">
            <Calendar size={11} />
            {new Date(row.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-text-light">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "100px",
      cell: (row) => {
        const canCancel =
          row.status === "pending" || row.status === "in_progress";
        if (!canCancel) return null;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel(row.id);
            }}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-[11px] font-semibold text-text-light hover:bg-surface-hover disabled:opacity-50"
          >
            {t.psychologist.cancelAssignment}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max">
          <FilterChip
            active={statusFilter === null}
            onClick={() => setStatusFilter(null)}
            label={t.psychologist.codeAny}
          />
          {STATUSES.map(({ key, labelKey }) => (
            <FilterChip
              key={key}
              active={statusFilter === key}
              onClick={() =>
                setStatusFilter((prev) => (prev === key ? null : key))
              }
              label={(t.psychologist as unknown as Translations)[labelKey]}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-light" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center py-12 rounded-xl bg-surface border border-border-light">
          <ClipboardList size={28} className="text-text-light mb-2" />
          <p className="text-sm text-text-light">
            {t.psychologist.assignmentsEmpty}
          </p>
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          getRowKey={(row) => row.id}
          density="compact"
        />
      )}

      {/* Inline message rows below the table for assignments with student-message */}
      {data && data.length > 0 && (
        <ul className="space-y-1.5">
          {data
            .filter((row) => row.studentMessage)
            .map((row) => (
              <li
                key={`msg-${row.id}`}
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-secondary text-[11px] text-text-light"
              >
                <span className="font-semibold text-text-main shrink-0">
                  {targetLabel(row)}:
                </span>
                <span className="italic">"{row.studentMessage}"</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
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
        "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 border",
        active
          ? "bg-brand-soft text-brand-deep border-brand/30"
          : "bg-surface-secondary text-text-light border-border-light hover:bg-surface-hover",
      )}
    >
      {label}
    </button>
  );
}
