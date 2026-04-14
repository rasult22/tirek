import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { testDefinitions } from "@tirek/shared";
import type { AssignedTest } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";
import { testsApi } from "../api/tests.js";

const TEST_ICONS: Record<string, { iconBg: string; emoji: string }> = {
  "phq-a": { iconBg: "bg-blue-100", emoji: "\u{1F49C}" },
  "gad-7": { iconBg: "bg-teal-100", emoji: "\u{1F9E1}" },
  rosenberg: { iconBg: "bg-emerald-100", emoji: "\u{1F49A}" },
  scared: { iconBg: "bg-amber-100", emoji: "\u{1F630}" },
  stai: { iconBg: "bg-sky-100", emoji: "\u{1F30A}" },
  "pss-10": { iconBg: "bg-red-100", emoji: "\u{1F525}" },
  bullying: { iconBg: "bg-orange-100", emoji: "\u{1F6E1}\u{FE0F}" },
  "academic-burnout": { iconBg: "bg-yellow-100", emoji: "\u{1F4DA}" },
  sociometry: { iconBg: "bg-cyan-100", emoji: "\u{1F91D}" },
  "eysenck-self-esteem": { iconBg: "bg-violet-100", emoji: "\u{1FA9E}" },
  "andreeva-learning": { iconBg: "bg-lime-100", emoji: "\u{1F4D6}" },
  "bullying-violence": { iconBg: "bg-rose-100", emoji: "\u{26A0}\u{FE0F}" },
  "buss-darky": { iconBg: "bg-red-100", emoji: "\u{1F4A2}" },
  "beck-depression": { iconBg: "bg-indigo-100", emoji: "\u{1F327}\u{FE0F}" },
  "phillips-anxiety": { iconBg: "bg-purple-100", emoji: "\u{1F3EB}" },
  "olweus-bullying": { iconBg: "bg-amber-100", emoji: "\u{1F6A8}" },
};

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function StatusBadge({ assignment }: { assignment: AssignedTest }) {
  if (assignment.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        <CheckCircle2 size={10} /> Пройдено
      </span>
    );
  }
  if (assignment.overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
        <AlertTriangle size={10} /> Просрочено
      </span>
    );
  }
  if (assignment.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <Clock size={10} /> Не завершено
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
      <Sparkles size={10} /> Новое
    </span>
  );
}

export function TestsListPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showOthers, setShowOthers] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["tests", "assigned"],
    queryFn: () => testsApi.assigned(),
  });

  const allTests = Object.values(testDefinitions);

  // De-dupe "Other tests" by removing those already assigned
  const assignedSlugs = new Set(
    assignments.map((a) => a.test?.slug).filter((s): s is string => Boolean(s)),
  );
  const otherTests = allTests.filter((t) => !assignedSlugs.has(t.slug));

  const handleAssignmentClick = (a: AssignedTest) => {
    if (!a.test) return;
    if (a.status === "completed" && a.completedSessionId) {
      navigate(`/tests/results/${a.completedSessionId}`);
    } else {
      navigate(`/tests/${a.test.slug}`);
    }
  };

  const assignmentActionLabel = (a: AssignedTest) => {
    if (a.status === "completed") return "Посмотреть результат";
    if (a.status === "in_progress") return "Продолжить";
    return "Пройти";
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border-light shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.tests.title}</h1>
        </div>

        {/* Assigned section */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-text-main">
            Назначенные психологом
          </h2>
          {assignments.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border-light bg-white px-4 py-6 text-center">
              <p className="text-xs text-text-light">
                Пока психолог не назначил вам тестов. Можно пройти любой из
                раздела ниже.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3 stagger-children">
              {assignments.map((a) => {
                if (!a.test) return null;
                const meta =
                  TEST_ICONS[a.test.slug] ??
                  { iconBg: "bg-gray-100", emoji: "\u{1F4CB}" };
                const name =
                  language === "kz" ? a.test.nameKz ?? a.test.nameRu : a.test.nameRu;
                const due = formatDueDate(a.dueDate);
                const borderClass = a.overdue
                  ? "border-red-200"
                  : a.status === "completed"
                    ? "border-emerald-200"
                    : "border-border-light";
                return (
                  <button
                    key={a.assignmentId}
                    onClick={() => handleAssignmentClick(a)}
                    className={`btn-press flex w-full items-start gap-4 rounded-2xl bg-white border ${borderClass} p-5 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-text-main">{name}</p>
                        <StatusBadge assignment={a} />
                      </div>
                      <p className="mt-0.5 text-xs text-text-light line-clamp-2">
                        {a.test.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] font-bold">
                        {due && (
                          <span
                            className={
                              a.overdue ? "text-red-600" : "text-text-light"
                            }
                          >
                            Срок: {due}
                          </span>
                        )}
                        <span className="text-primary-dark">
                          {assignmentActionLabel(a)} →
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-text-light mt-1" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Other tests (collapsible) */}
        <section className="mt-8">
          <button
            onClick={() => setShowOthers((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-white border border-border-light px-4 py-3 shadow-sm"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-text-main">Другие тесты</p>
              <p className="text-[11px] text-text-light">
                Можно пройти самостоятельно · {otherTests.length}
              </p>
            </div>
            {showOthers ? (
              <ChevronUp size={18} className="text-text-light" />
            ) : (
              <ChevronDown size={18} className="text-text-light" />
            )}
          </button>

          {showOthers && (
            <div className="mt-3 space-y-3 stagger-children">
              {otherTests.map((test) => {
                const meta =
                  TEST_ICONS[test.slug] ??
                  { iconBg: "bg-gray-100", emoji: "\u{1F4CB}" };
                const name = language === "kz" ? test.nameKz : test.nameRu;
                const desc =
                  language === "kz" ? test.descriptionKz : test.descriptionRu;
                return (
                  <button
                    key={test.slug}
                    onClick={() => navigate(`/tests/${test.slug}`)}
                    className="btn-press flex w-full items-center gap-4 rounded-2xl bg-white border border-border-light p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-text-main">{name}</p>
                      <p className="mt-0.5 text-xs text-text-light line-clamp-2">
                        {desc}
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold text-primary-dark">
                        {test.questions.length} {t.tests.question.toLowerCase()}
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-text-light" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
