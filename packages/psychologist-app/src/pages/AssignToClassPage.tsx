import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { assignTest } from "../api/diagnostics.js";
import { testDefinitions } from "@tirek/shared";
import { ArrowLeft, Check, ClipboardPlus, Loader2, X } from "lucide-react";
import { clsx } from "clsx";

const STUDENT_MESSAGE_MAX = 500;
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLASS_LETTERS = ["А", "Ә", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function AssignToClassPage() {
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

  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string>("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      assignTest({
        testSlug,
        target: "class",
        grade: grade ?? undefined,
        classLetter: classLetter || undefined,
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

  const canSubmit = !!testSlug && grade !== null && !mutation.isPending;

  const classLabel =
    grade !== null ? `${grade}${classLetter}` : "";

  const submitLabel = grade !== null
    ? t.psychologist.assignSubmitForClass.replace("{class}", classLabel)
    : t.psychologist.assignSubmitFallbackClass;

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
          {t.psychologist.assignClassTitle}
        </h1>
        {td && (
          <p className="mt-1 text-sm text-text-light">{testName}</p>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 space-y-5">
        {/* Grade chips */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.assignSelectGrade}
          </label>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={clsx(
                  "min-w-10 h-10 px-3 rounded-full text-sm font-semibold transition-colors border",
                  grade === g
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-main border-border hover:border-input-border",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Class letter chips */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.assignSelectClassLetter}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setClassLetter("")}
              className={clsx(
                "min-w-10 h-10 px-3 rounded-full text-sm font-semibold transition-colors border",
                classLetter === ""
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-main border-border hover:border-input-border",
              )}
            >
              {t.psychologist.allClasses}
            </button>
            {CLASS_LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setClassLetter(l)}
                className={clsx(
                  "min-w-10 h-10 px-3 rounded-full text-sm font-semibold transition-colors border",
                  classLetter === l
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-main border-border hover:border-input-border",
                )}
              >
                {l}
              </button>
            ))}
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

        {/* Class message */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            {t.psychologist.assignMessageOptionalLabel}
          </label>
          <textarea
            value={studentMessage}
            onChange={(e) =>
              setStudentMessage(e.target.value.slice(0, STUDENT_MESSAGE_MAX))
            }
            rows={3}
            maxLength={STUDENT_MESSAGE_MAX}
            placeholder={t.psychologist.assignMessageClassPlaceholder}
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
