import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { testsApi } from "../api/tests.js";
import { testDefinitions } from "@tirek/shared";

export function TestPage() {
  const t = useT();
  const { language } = useLanguage();
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const testDef = testDefinitions[testId as keyof typeof testDefinitions];
  const questions = testDef?.questions ?? [];
  const options = testDef?.options ?? [];

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const startMutation = useMutation({
    mutationFn: () => testsApi.start(testId!),
    onSuccess: (session) => setSessionId(session.id),
  });

  const answerMutation = useMutation({
    mutationFn: (data: { questionIndex: number; answer: number }) =>
      testsApi.answer(sessionId!, data),
  });

  const completeMutation = useMutation({
    mutationFn: () => testsApi.complete(sessionId!),
    onSuccess: (session) => navigate(`/tests/results/${session.id}`, { replace: true }),
  });

  useEffect(() => {
    if (testDef && !sessionId) {
      startMutation.mutate();
    }
  }, [testId]);

  if (!testDef) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-light">{t.common.error}</p>
      </div>
    );
  }

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;
  const currentAnswer = answers[currentQ];

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: value }));
    if (sessionId) {
      answerMutation.mutate({ questionIndex: currentQ, answer: value });
    }
  };

  const handleNext = () => {
    if (isLast) {
      completeMutation.mutate();
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tests")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-text-light">
              {t.tests.question} {currentQ + 1} {t.tests.of} {questions.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 flex-col px-5 pt-8">
        <p className="text-base font-bold leading-relaxed text-text-main">
          {language === "kz" ? question.textKz : question.textRu}
        </p>

        {/* Options */}
        <div className="mt-6 space-y-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                currentAnswer === opt.value
                  ? "border-primary-dark bg-primary/10 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  currentAnswer === opt.value
                    ? "border-primary-dark bg-primary-dark"
                    : "border-gray-300"
                }`}
              >
                {currentAnswer === opt.value && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-text-main">
                {language === "kz" ? opt.labelKz : opt.labelRu}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Next/Submit button */}
      <div className="px-5 pb-8 pt-4">
        <button
          onClick={handleNext}
          disabled={currentAnswer === undefined || completeMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all disabled:opacity-40"
        >
          {completeMutation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isLast ? (
            <>
              <Check size={18} />
              {t.tests.submit}
            </>
          ) : (
            <>
              {t.common.next}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
