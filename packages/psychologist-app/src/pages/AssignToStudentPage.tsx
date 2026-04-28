import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { assignTest } from "../api/diagnostics.js";
import { getStudents } from "../api/students.js";
import { testDefinitions } from "@tirek/shared";
import {
  ArrowLeft,
  Check,
  ClipboardPlus,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { clsx } from "clsx";

const STUDENT_MESSAGE_MAX = 500;

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function AssignToStudentPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const testSlug = searchParams.get("testSlug") ?? "";
  const td =
    testSlug && testSlug in testDefinitions
      ? testDefinitions[testSlug as keyof typeof testDefinitions]
      : null;
  const testName = td ? (language === "kz" ? td.nameKz : td.nameRu) : testSlug;

  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  const filteredStudents = useMemo(() => {
    const list = students?.data ?? [];
    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const selectedStudent = students?.data?.find((s) => s.id === studentId);

  const mutation = useMutation({
    mutationFn: () =>
      assignTest({
        testSlug,
        target: "student",
        studentId,
        dueDate: dueDate || undefined,
        studentMessage:
          studentMessage.trim().length > 0
            ? studentMessage.trim()
            : undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/diagnostics"), 1500);
    },
  });

  const canSubmit = !!testSlug && !!studentId && !mutation.isPending;

  const submitLabel = selectedStudent
    ? t.psychologist.assignSubmitForStudent.replace(
        "{name}",
        selectedStudent.name,
      )
    : t.psychologist.assignSubmitFallbackStudent;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Check size={32} className="text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text-main">
          {t.psychologist.assignSuccessTitle}
        </h2>
        <p className="text-sm text-text-light mt-1">
          {t.psychologist.assignSuccessRedirect}
        </p>
      </div>
    );
  }

  return (
    <div className="relative pb-28 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <div>
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.assignStudentTitle}
        </h1>
        {td && (
          <p className="mt-1 text-sm text-text-light">{testName}</p>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 space-y-5">
        {/* Student selector */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.assignSelectStudent}
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
          <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-gray-50">
            {filteredStudents.map((s) => (
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
                  {s.grade ?? ""}
                  {s.classLetter ?? ""}
                </span>
                {studentId === s.id && (
                  <Check size={14} className="text-primary" />
                )}
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <p className="px-3 py-4 text-sm text-text-light text-center">
                {t.psychologist.assignSelectStudentEmpty}
              </p>
            )}
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.assignDueDateLabel}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-input-border bg-surface text-sm text-text-main
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-light hover:bg-surface-hover"
              >
                <X size={12} />
                {t.psychologist.assignDueDateClear}
              </button>
            )}
          </div>
        </div>

        {/* Student message */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.studentMessageLabel}
          </label>
          <textarea
            value={studentMessage}
            onChange={(e) =>
              setStudentMessage(e.target.value.slice(0, STUDENT_MESSAGE_MAX))
            }
            rows={3}
            maxLength={STUDENT_MESSAGE_MAX}
            placeholder={t.psychologist.studentMessagePlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-input-border bg-surface text-sm text-text-main
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
          />
          <p className="text-[11px] text-text-light mt-1">
            {studentMessage.length} / {STUDENT_MESSAGE_MAX} —{" "}
            {t.psychologist.studentMessageMaxHint}
          </p>
        </div>

        {mutation.isError && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
            {t.common.error}
          </div>
        )}
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-3 bg-gradient-to-t from-bg via-bg to-transparent z-30">
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="btn-press w-full h-12 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg
            hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            inline-flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ClipboardPlus size={16} />
          )}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
