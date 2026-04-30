import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { assignTest } from "../api/diagnostics.js";
import { testDefinitions } from "@tirek/shared";
import {
  ArrowLeft,
  Check,
  ClipboardPlus,
  Loader2,
  X,
  ChevronRight,
  Calendar,
  MessageSquare,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { Stepper, type StepperStep } from "../components/ui/Stepper.js";

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

  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<number | null>(null);
  const [classLetter, setClassLetter] = useState<string>("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [studentMessage, setStudentMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const steps: StepperStep[] = [
    { id: "class", label: t.psychologist.assignSelectGrade },
    { id: "details", label: t.psychologist.assignDueDateLabel },
    { id: "confirm", label: t.psychologist.assignSuccessTitle },
  ];

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
  const canGoNext = (step === 0 && grade !== null) || step === 1;

  const classLabel =
    grade !== null
      ? `${grade}${classLetter || ` (${t.psychologist.allClasses})`}`
      : "—";

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
    <div className="max-w-3xl mx-auto space-y-5">
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
        {td && <p className="mt-1 text-sm text-text-light">{testName}</p>}
      </div>

      <div className="px-2">
        <Stepper steps={steps} current={step} onStepClick={setStep} />
      </div>

      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
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

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
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
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
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

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t.psychologist.assignMessageOptionalLabel}
              </label>
              <textarea
                value={studentMessage}
                onChange={(e) =>
                  setStudentMessage(e.target.value.slice(0, STUDENT_MESSAGE_MAX))
                }
                rows={4}
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
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-text-main">
              {t.psychologist.assignSuccessTitle}
            </h2>

            <PreviewRow
              icon={ClipboardPlus}
              label={t.psychologist.diagnostics}
              value={testName}
            />
            <PreviewRow
              icon={Users}
              label={t.psychologist.assignSelectGrade}
              value={classLabel}
            />
            <PreviewRow
              icon={Calendar}
              label={t.psychologist.assignDueDateLabel}
              value={dueDate || "—"}
            />
            {studentMessage.trim() && (
              <PreviewRow
                icon={MessageSquare}
                label={t.psychologist.assignMessageOptionalLabel}
                value={studentMessage.trim()}
              />
            )}

            {mutation.isError && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
                {t.common.error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-semibold text-text-light hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.common.back}
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={!canGoNext}
            className="btn-press flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {t.common.next}
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="btn-press flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ClipboardPlus size={14} />
            )}
            {t.psychologist.assignSubmitFallbackClass}
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border-light last:border-0">
      <Icon size={14} className="text-text-light mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-text-light uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm font-medium text-text-main mt-0.5 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}
