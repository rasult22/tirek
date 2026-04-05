import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { getStudents } from "../api/students.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import { Search, Filter, ChevronUp, ChevronDown, Users, Loader2 } from "lucide-react";
import { clsx } from "clsx";

type SortField = "name" | "class" | "status" | "lastActive";
type SortDir = "asc" | "desc";

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

export function StudentsListPage() {
  const t = useT();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [classLetter, setClassLetter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students", { grade: grade || undefined, classLetter: classLetter || undefined }],
    queryFn: () =>
      getStudents({
        grade: grade ? Number(grade) : undefined,
        classLetter: classLetter || undefined,
      }),
  });

  const filteredAndSorted = useMemo(() => {
    if (!students?.data) return [];
    let result = students.data;

    // Client-side search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((st) => st.name.toLowerCase().includes(s));
    }

    // Sort
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

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">
        {t.psychologist.students}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search + "..."}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-input-border bg-surface text-sm
              text-text-main placeholder:text-text-light
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Grade filter */}
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
          />
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-10 pl-8 pr-8 rounded-lg border border-input-border bg-surface text-sm text-text-main
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

        {/* Class letter filter */}
        <select
          value={classLetter}
          onChange={(e) => setClassLetter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">{t.auth.selectClass}</option>
          {["A", "B", "C", "D", "E"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-text-light" />
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Users size={40} className="text-text-light mb-3" />
            <p className="text-sm text-text-light">{t.common.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-surface-secondary/50">
                  <th
                    className="text-left px-5 py-3 font-semibold text-text-light cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      Name <SortIcon field="name" />
                    </span>
                  </th>
                  <th
                    className="text-left px-5 py-3 font-semibold text-text-light cursor-pointer select-none"
                    onClick={() => toggleSort("class")}
                  >
                    <span className="flex items-center gap-1">
                      Class <SortIcon field="class" />
                    </span>
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-light">
                    Mood
                  </th>
                  <th
                    className="text-left px-5 py-3 font-semibold text-text-light cursor-pointer select-none"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <SortIcon field="status" />
                    </span>
                  </th>
                  <th
                    className="text-left px-5 py-3 font-semibold text-text-light cursor-pointer select-none"
                    onClick={() => toggleSort("lastActive")}
                  >
                    <span className="flex items-center gap-1">
                      Last Active <SortIcon field="lastActive" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border-light hover:bg-surface-hover/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-text-main">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-light">
                      {student.grade != null
                        ? `${student.grade}${student.classLetter ?? ""}`
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-lg">
                      {student.lastMood != null
                        ? moodEmojis[student.lastMood] ?? "\u2014"
                        : "\u2014"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={student.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-text-light">
                      {formatDate(student.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
