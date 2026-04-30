import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Search,
  Loader2,
  Users,
  Plus,
  MoreHorizontal,
  MessageSquare,
  ExternalLink,
  UserMinus,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import {
  detachStudent,
  getAtRiskStudents,
  getStudents,
} from "../api/students.js";
import { directChatApi } from "../api/direct-chat.js";
import { formatRiskReason } from "@tirek/shared";
import type { StudentOverview } from "@tirek/shared";
import type { AtRiskStudent } from "@tirek/shared/api";
import { ErrorState } from "../components/ui/ErrorState.js";
import { MoodScale } from "../components/ui/MoodScale.js";
import {
  DataTable,
  type DataTableColumn,
} from "../components/ui/DataTable.js";
import { PendingList } from "../components/students/PendingList.js";
import {
  GenerateCodesSheet,
  type GenerateCodesPrefill,
} from "../components/students/GenerateCodesSheet.js";

type Segment = "active" | "pending";

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

const STATUS_ORDER: Record<StudentOverview["status"], number> = {
  crisis: 0,
  attention: 1,
  normal: 2,
};

function classKey(s: StudentOverview, noClassLabel: string): string {
  if (s.grade == null) return noClassLabel;
  return `${s.grade}${s.classLetter ?? ""}`;
}

function classSortKey(s: StudentOverview): number {
  if (s.grade == null) return Number.MAX_SAFE_INTEGER;
  const letter = s.classLetter ?? "";
  return s.grade * 100 + (letter ? letter.charCodeAt(0) : 0);
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function StudentsListPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [segment, setSegment] = useState<Segment>("active");
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [classLetter, setClassLetter] = useState<string>("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrefill, setSheetPrefill] = useState<GenerateCodesPrefill | null>(
    null,
  );

  const {
    data: studentsResp,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "students",
      { grade: grade || undefined, classLetter: classLetter || undefined },
    ],
    queryFn: () =>
      getStudents({
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      }),
    enabled: segment === "active",
  });

  const { data: atRiskResp } = useQuery({
    queryKey: ["students", "at-risk"],
    queryFn: () => getAtRiskStudents(),
    enabled: segment === "active",
  });

  const reasonByStudentId = useMemo(() => {
    const map = new Map<string, AtRiskStudent>();
    for (const s of atRiskResp?.data ?? []) map.set(s.studentId, s);
    return map;
  }, [atRiskResp]);

  const filtered = useMemo(() => {
    const data = studentsResp?.data ?? [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((s) => s.name.toLowerCase().includes(q));
  }, [studentsResp, search]);

  const sortedByClass = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const sk = classSortKey(a) - classSortKey(b);
      if (sk !== 0) return sk;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sortedByClass) {
      const k = classKey(s, t.psychologist.studentsTableNoClass);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [sortedByClass, t.psychologist.studentsTableNoClass]);

  const detachMutation = useMutation({
    mutationFn: (id: string) => detachStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: () => {
      toast.error(t.common.actionFailed);
    },
  });

  const messageMutation = useMutation({
    mutationFn: (studentId: string) =>
      directChatApi.createConversation(studentId),
    onSuccess: (conv) => {
      navigate(`/messages/${conv.id}`);
    },
    onError: () => {
      toast.error(t.common.actionFailed);
    },
  });

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openAddSheet() {
    setSheetPrefill(null);
    setSheetOpen(true);
  }

  function openGenerateNew(prefill: GenerateCodesPrefill) {
    setSheetPrefill(prefill);
    setSheetOpen(true);
  }

  function handleSheetSuccess() {
    setSheetOpen(false);
    setSheetPrefill(null);
    setSegment("pending");
  }

  function handleDetach(student: StudentOverview) {
    if (
      !window.confirm(
        `${t.psychologist.detachConfirmTitle}\n\n${t.psychologist.detachConfirmDescription}`,
      )
    )
      return;
    detachMutation.mutate(student.id);
    setOpenMenuId(null);
  }

  function handleMessage(student: StudentOverview) {
    messageMutation.mutate(student.id);
    setOpenMenuId(null);
  }

  function handleOpen(student: StudentOverview) {
    setOpenMenuId(null);
    navigate(`/students/${student.id}`);
  }

  const locale = language === "kz" ? "kk-KZ" : "ru-RU";

  const columns: DataTableColumn<StudentOverview>[] = useMemo(
    () => [
      {
        key: "name",
        header: t.psychologist.studentsTableColumnName,
        width: "18%",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center text-xs font-semibold shrink-0">
              {r.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-text-main truncate">
              {r.name}
            </span>
          </div>
        ),
      },
      {
        key: "class",
        header: t.psychologist.studentsTableColumnClass,
        width: "8%",
        sortable: true,
        sortValue: (r) => classSortKey(r),
        cell: (r) =>
          r.grade != null ? (
            <span className="text-text-main">
              {r.grade}
              {r.classLetter ?? ""}
            </span>
          ) : (
            <span className="text-text-light">—</span>
          ),
      },
      {
        key: "risk",
        header: t.psychologist.studentsTableColumnRisk,
        width: "10%",
        sortable: true,
        sortValue: (r) => STATUS_ORDER[r.status],
        cell: (r) => <RiskCell status={r.status} />,
      },
      {
        key: "lastMood",
        header: t.psychologist.studentsTableColumnLastMood,
        width: "12%",
        cell: (r) =>
          r.lastMood != null ? (
            <MoodScale value={r.lastMood as 1 | 2 | 3 | 4 | 5} />
          ) : (
            <span className="text-text-light">—</span>
          ),
      },
      {
        key: "lastActivity",
        header: t.psychologist.studentsTableColumnLastActivity,
        width: "15%",
        cell: (r) => (
          <span
            className={
              r.lastActive ? "text-text-main" : "text-text-light"
            }
          >
            {formatDate(r.lastActive, locale)}
          </span>
        ),
      },
      {
        key: "lastSignal",
        header: t.psychologist.studentsTableColumnLastSignal,
        width: "25%",
        cell: (r) => {
          const reasonRow = reasonByStudentId.get(r.id);
          const text = reasonRow
            ? formatRiskReason({ reason: reasonRow.reason, t, language })
            : null;
          return (
            <span
              className={clsx(
                "block truncate",
                text ? "text-text-main" : "text-text-light",
              )}
              title={text ?? undefined}
            >
              {text ?? "—"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: (
          <span className="sr-only">
            {t.psychologist.studentsTableColumnActions}
          </span>
        ),
        width: "12%",
        align: "right",
        cell: (r) => (
          <RowMenu
            isOpen={openMenuId === r.id}
            onToggle={() =>
              setOpenMenuId((prev) => (prev === r.id ? null : r.id))
            }
            onClose={() => setOpenMenuId(null)}
            onMessage={() => handleMessage(r)}
            onOpen={() => handleOpen(r)}
            onDetach={() => handleDetach(r)}
            messagePending={
              messageMutation.isPending &&
              messageMutation.variables === r.id
            }
            detachPending={
              detachMutation.isPending && detachMutation.variables === r.id
            }
            labels={{
              message: t.psychologist.studentsTableMenuMessage,
              open: t.psychologist.studentsTableMenuOpen,
              detach: t.psychologist.studentsTableMenuDetach,
            }}
          />
        ),
      },
    ],
    [
      t,
      language,
      locale,
      reasonByStudentId,
      openMenuId,
      messageMutation,
      detachMutation,
    ],
  );

  if (isError && segment === "active") {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.students}
        </h1>
        <button
          type="button"
          onClick={openAddSheet}
          className="btn-press inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} />
          {t.psychologist.addNewStudent}
        </button>
      </div>

      <div className="inline-grid grid-cols-2 rounded-xl bg-surface-secondary p-1 max-w-sm">
        <button
          type="button"
          onClick={() => setSegment("active")}
          className={clsx(
            "h-9 px-4 rounded-lg text-xs font-semibold transition-colors",
            segment === "active"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light hover:text-text-main",
          )}
        >
          {t.psychologist.studentsTabActive}
        </button>
        <button
          type="button"
          onClick={() => setSegment("pending")}
          className={clsx(
            "h-9 px-4 rounded-lg text-xs font-semibold transition-colors",
            segment === "pending"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light hover:text-text-main",
          )}
        >
          {t.psychologist.studentsTabPending}
        </button>
      </div>

      {segment === "active" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.common.search + "..."}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="h-10 px-3 rounded-xl border border-input-border bg-surface text-sm text-text-main"
              >
                <option value="">{t.psychologist.studentsFilterAllGrades}</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={classLetter}
                onChange={(e) => setClassLetter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-input-border bg-surface text-sm text-text-main"
              >
                <option value="">{t.psychologist.studentsFilterAllLetters}</option>
                {CLASS_LETTERS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-text-light" />
            </div>
          ) : sortedByClass.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-xl border border-border bg-surface">
              <Users size={36} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          ) : (
            <DataTable
              data={sortedByClass}
              columns={columns}
              getRowKey={(r) => r.id}
              groupBy={(r) => classKey(r, t.psychologist.studentsTableNoClass)}
              isGroupCollapsed={(key) => collapsedGroups.has(key)}
              renderGroupHeader={(key, _count) => {
                const total = groupCounts.get(key) ?? 0;
                const collapsed = collapsedGroups.has(key);
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(key);
                    }}
                    className="inline-flex items-center gap-2 text-text-main hover:text-primary transition-colors"
                  >
                    <span
                      className={clsx(
                        "inline-block transition-transform",
                        collapsed ? "-rotate-90" : "rotate-0",
                      )}
                    >
                      <ChevronDownGlyph />
                    </span>
                    <span className="font-semibold uppercase tracking-wide">
                      {key}
                    </span>
                    <span className="font-normal normal-case tracking-normal text-text-light">
                      ({total})
                    </span>
                  </button>
                );
              }}
              onRowClick={(r) => {
                if (openMenuId) return;
                navigate(`/students/${r.id}`);
              }}
            />
          )}
        </div>
      ) : (
        <PendingList onGenerateNew={openGenerateNew} />
      )}

      <GenerateCodesSheet
        open={sheetOpen}
        prefill={sheetPrefill}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSheetSuccess}
      />
    </div>
  );
}

function ChevronDownGlyph() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 4 L5 7 L8 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RiskCell({ status }: { status: StudentOverview["status"] }) {
  const t = useT();
  const labels: Record<StudentOverview["status"], string> = {
    normal: t.psychologist.statusNormal,
    attention: t.psychologist.statusAttention,
    crisis: t.psychologist.statusCrisis,
  };
  const dotClass =
    status === "crisis"
      ? "bg-danger"
      : status === "attention"
        ? "bg-warning"
        : "bg-success";
  const textClass =
    status === "crisis"
      ? "text-danger"
      : status === "attention"
        ? "text-warning"
        : "text-text-light";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx("h-2 w-2 rounded-full", dotClass)} />
      <span className={clsx("text-xs font-medium", textClass)}>
        {labels[status]}
      </span>
    </span>
  );
}

interface RowMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMessage: () => void;
  onOpen: () => void;
  onDetach: () => void;
  messagePending: boolean;
  detachPending: boolean;
  labels: { message: string; open: string; detach: string };
}

function RowMenu({
  isOpen,
  onToggle,
  onClose,
  onMessage,
  onOpen,
  onDetach,
  messagePending,
  detachPending,
  labels,
}: RowMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-light hover:bg-surface-hover hover:text-text-main transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 min-w-[200px] rounded-xl border border-border bg-surface shadow-lg py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onMessage}
            disabled={messagePending}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface-hover disabled:opacity-60"
          >
            {messagePending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MessageSquare size={14} />
            )}
            {labels.message}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onOpen}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface-hover"
          >
            <ExternalLink size={14} />
            {labels.open}
          </button>
          <div className="my-1 border-t border-border-light" />
          <button
            type="button"
            role="menuitem"
            onClick={onDetach}
            disabled={detachPending}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/8 disabled:opacity-60"
          >
            {detachPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserMinus size={14} />
            )}
            {labels.detach}
          </button>
        </div>
      )}
    </div>
  );
}
