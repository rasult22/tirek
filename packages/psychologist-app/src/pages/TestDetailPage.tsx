import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  Lightbulb,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import { testDefinitions } from "@tirek/shared";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { NotFoundPage } from "./NotFoundPage.js";

export function TestDetailPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !(slug in testDefinitions)) {
    return <NotFoundPage />;
  }

  const td = testDefinitions[slug as keyof typeof testDefinitions] as unknown as {
    slug: string;
    nameRu: string;
    nameKz: string;
    descriptionRu: string;
    descriptionKz: string;
    questions: ReadonlyArray<{ index: number }>;
    durationMinutes?: number;
    ageRange?: { minGrade: number; maxGrade: number };
    tipsRu?: string;
    tipsKz?: string;
  };
  const name = language === "kz" ? td.nameKz : td.nameRu;
  const description = language === "kz" ? td.descriptionKz : td.descriptionRu;
  const tips = language === "kz" ? td.tipsKz : td.tipsRu;

  function goAssign(target: "student" | "class") {
    const path =
      target === "student"
        ? "/diagnostics/assign-student"
        : "/diagnostics/assign-class";
    navigate(`${path}?testSlug=${td.slug}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate("/diagnostics")}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-soft to-surface border border-brand/10 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center shadow-sm shrink-0">
            <ClipboardList size={22} className="text-brand-deep" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-main leading-tight">
              {name}
            </h1>
            <p className="mt-1.5 text-sm text-text-light leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {td.durationMinutes != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-text-light border border-border-light">
              <Clock size={12} />
              {t.psychologist.testDurationMinutes.replace(
                "{n}",
                String(td.durationMinutes),
              )}
            </span>
          )}
          {td.ageRange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-text-light border border-border-light">
              <GraduationCap size={12} />
              {t.psychologist.testAgeRangeGrades
                .replace("{from}", String(td.ageRange.minGrade))
                .replace("{to}", String(td.ageRange.maxGrade))}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-text-light border border-border-light">
            <ListChecks size={12} />
            {td.questions.length} {language === "kz" ? "сұрақ" : "вопр."}
          </span>
        </div>
      </div>

      {/* CTA bar — inline (no fixed positioning, no mobile bottom nav on web) */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => goAssign("student")}
          className="btn-press flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary-dark hover:shadow transition-all"
        >
          {t.psychologist.assignToStudentBtn}
        </button>
        <button
          type="button"
          onClick={() => goAssign("class")}
          className="btn-press flex-1 h-11 rounded-xl bg-surface border border-primary text-primary text-sm font-semibold hover:bg-brand-soft transition-colors"
        >
          {t.psychologist.assignToClassBtn}
        </button>
      </div>

      {/* When-to-assign tips */}
      {tips && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-warning" />
            <span className="text-sm font-bold text-text-main">
              {t.psychologist.testWhenToAssign}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-text-main">{tips}</p>
        </div>
      )}
    </div>
  );
}
