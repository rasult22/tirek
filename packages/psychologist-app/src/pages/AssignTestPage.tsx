import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { assignTest } from "../api/diagnostics.js";
import { testDefinitions } from "@tirek/shared";
import { getStudents } from "../api/students.js";
import {
  ArrowLeft,
  ClipboardPlus,
  Users,
  User,
  Loader2,
  Check,
  Search,
} from "lucide-react";
import { clsx } from "clsx";

type Target = "student" | "class";

export function AssignTestPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [testSlug, setTestSlug] = useState("");
  const [target, setTarget] = useState<Target>("class");
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [classLetter, setClassLetter] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
    enabled: target === "student",
  });

  const filteredStudents = students?.data?.filter((s) =>
    studentSearch
      ? s.name.toLowerCase().includes(studentSearch.toLowerCase())
      : true,
  );

  const mutation = useMutation({
    mutationFn: () =>
      assignTest({
        testSlug,
        target,
        studentId: target === "student" ? studentId : undefined,
        grade: target === "class" && grade ? Number(grade) : undefined,
        classLetter: target === "class" ? classLetter || undefined : undefined,
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/diagnostics"), 2000);
    },
  });

  const canSubmit =
    testSlug &&
    (target === "student" ? !!studentId : !!grade) &&
    !mutation.isPending;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Check size={32} className="text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text-main">
          Test assigned successfully
        </h2>
        <p className="text-sm text-text-light mt-1">
          Redirecting to diagnostics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate("/diagnostics")}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <h1 className="text-xl font-bold text-text-main">
        {t.psychologist.assignTest}
      </h1>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 space-y-5">
        {/* Select test */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Test
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(testDefinitions).map((td) => {
              const test = {
                slug: td.slug,
                name: language === "kz" ? td.nameKz : td.nameRu,
                desc: language === "kz" ? td.descriptionKz : td.descriptionRu,
              };
              return (
              <button
                key={test.slug}
                type="button"
                onClick={() => setTestSlug(test.slug)}
                className={clsx(
                  "p-4 rounded-lg border-2 text-left transition-colors",
                  testSlug === test.slug
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-input-border",
                )}
              >
                <p className="text-sm font-semibold text-text-main">
                  {test.name}
                </p>
                <p className="text-xs text-text-light mt-1">{test.desc}</p>
              </button>
              );
            })}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Assign to
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTarget("class")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                target === "class"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-light hover:border-input-border",
              )}
            >
              <Users size={16} />
              {t.psychologist.assignToClass}
            </button>
            <button
              type="button"
              onClick={() => setTarget("student")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors",
                target === "student"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-light hover:border-input-border",
              )}
            >
              <User size={16} />
              {t.psychologist.assignToStudent}
            </button>
          </div>
        </div>

        {/* Student selector */}
        {target === "student" && (
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Student
            </label>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light"
              />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={t.common.search + "..."}
                className="w-full h-10 pl-8 pr-3 rounded-lg border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-gray-50">
              {filteredStudents?.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStudentId(s.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                    studentId === s.id
                      ? "bg-primary/5 text-primary"
                      : "hover:bg-surface-hover text-text-main",
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1">{s.name}</span>
                  <span className="text-xs text-text-light">
                    {s.grade}
                    {s.classLetter ?? ""}
                  </span>
                  {studentId === s.id && (
                    <Check size={14} className="text-primary" />
                  )}
                </button>
              ))}
              {filteredStudents?.length === 0 && (
                <p className="px-3 py-4 text-sm text-text-light text-center">
                  {t.common.noData}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Class selector */}
        {target === "class" && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-main mb-2">
                {t.auth.selectGrade}
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">--</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-main mb-2">
                {t.auth.selectClass}
              </label>
              <select
                value={classLetter}
                onChange={(e) => setClassLetter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">All letters</option>
                {["A", "B", "C", "D", "E"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Due date (optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
            {t.common.error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm
            font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending && (
            <Loader2 size={16} className="animate-spin" />
          )}
          <ClipboardPlus size={16} />
          {t.psychologist.assignTest}
        </button>
      </div>
    </div>
  );
}
