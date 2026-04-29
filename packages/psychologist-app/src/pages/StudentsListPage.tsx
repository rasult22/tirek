import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { getStudents } from "../api/students.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import { MoodScale } from "../components/ui/MoodScale.js";
import { Search, Filter, Users, Loader2, ChevronRight, Plus } from "lucide-react";
import { clsx } from "clsx";
import { ErrorState } from "../components/ui/ErrorState.js";
import { PendingList } from "../components/students/PendingList.js";
import {
  GenerateCodesSheet,
  type GenerateCodesPrefill,
} from "../components/students/GenerateCodesSheet.js";

type SortField = "name" | "class" | "status" | "lastActive";
type SortDir = "asc" | "desc";
type Segment = "active" | "pending";

export function StudentsListPage() {
  const t = useT();
  const navigate = useNavigate();

  const [segment, setSegment] = useState<Segment>("active");
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [classLetter, setClassLetter] = useState<string>("");
  const [sortField] = useState<SortField>("name");
  const [sortDir] = useState<SortDir>("asc");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrefill, setSheetPrefill] = useState<GenerateCodesPrefill | null>(
    null,
  );

  const { data: students, isLoading, isError, refetch } = useQuery({
    queryKey: ["students", { grade: grade || undefined, classLetter: classLetter || undefined }],
    queryFn: () =>
      getStudents({
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      }),
    enabled: segment === "active",
  });

  const filteredAndSorted = useMemo(() => {
    if (!students?.data) return [];
    let result = students.data;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((st) => st.name.toLowerCase().includes(s));
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "class":
          cmp = (a.grade ?? 0) - (b.grade ?? 0) || (a.classLetter ?? "").localeCompare(b.classLetter ?? "");
          break;
        case "status": {
          const order: Record<string, number> = { crisis: 0, attention: 1, normal: 2 };
          cmp = (order[a.status] ?? 2) - (order[b.status] ?? 2);
          break;
        }
        case "lastActive":
          cmp = (a.lastActive ?? "").localeCompare(b.lastActive ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, search, sortField, sortDir]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
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

  if (isError && segment === "active") {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="relative pb-20">
      <h1 className="text-xl font-bold text-text-main">
        {t.psychologist.students}
      </h1>

      {/* Segmented control */}
      <div className="mt-4 grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
        <button
          type="button"
          onClick={() => setSegment("active")}
          className={clsx(
            "h-9 rounded-lg text-xs font-semibold transition-colors",
            segment === "active"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light",
          )}
        >
          {t.psychologist.studentsTabActive}
        </button>
        <button
          type="button"
          onClick={() => setSegment("pending")}
          className={clsx(
            "h-9 rounded-lg text-xs font-semibold transition-colors",
            segment === "pending"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light",
          )}
        >
          {t.psychologist.studentsTabPending}
        </button>
      </div>

      {segment === "active" ? (
        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
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
                text-text-main placeholder:text-text-light
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
              />
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 pl-8 pr-8 rounded-xl border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
              >
                <option value="">{t.auth.selectGrade}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={classLetter}
              onChange={(e) => setClassLetter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input-border bg-surface text-sm text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">{t.auth.selectClass}</option>
              {["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Student cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-text-light" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Users size={36} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSorted.map((student) => (
                <button
                  key={student.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  className="btn-press w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border shadow-sm transition-all hover:shadow-md text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-main truncate">
                        {student.name}
                      </span>
                      <StatusBadge status={student.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-light">
                        {student.grade != null
                          ? `${student.grade}${student.classLetter ?? ""}`
                          : "—"}
                      </span>
                      <span className="text-xs text-text-light">&middot;</span>
                      {student.lastMood != null ? (
                        <MoodScale
                          value={student.lastMood as 1 | 2 | 3 | 4 | 5}
                        />
                      ) : (
                        <span className="text-xs text-text-light">—</span>
                      )}
                      <span className="text-xs text-text-light">&middot;</span>
                      <span className="text-xs text-text-light">
                        {formatDate(student.lastActive)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-light/40 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <PendingList onGenerateNew={openGenerateNew} />
        </div>
      )}

      {/* Sticky add button — fixed above bottom nav (h-16) */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 bg-gradient-to-t from-bg via-bg to-transparent z-30 pointer-events-none">
        <button
          onClick={openAddSheet}
          className="btn-press pointer-events-auto w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} />
          {t.psychologist.addNewStudent}
        </button>
      </div>

      <GenerateCodesSheet
        open={sheetOpen}
        prefill={sheetPrefill}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSheetSuccess}
      />
    </div>
  );
}
