import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, GraduationCap, Lightbulb } from "lucide-react";
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
      target === "student" ? "/diagnostics/assign-student" : "/diagnostics/assign-class";
    navigate(`${path}?testSlug=${td.slug}`);
  }

  return (
    <div className="relative pb-28 space-y-4">
      <button
        onClick={() => navigate("/diagnostics")}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <div>
        <h1 className="text-xl font-bold text-text-main">{name}</h1>
        <p className="mt-1 text-sm text-text-light">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {td.durationMinutes != null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-text-light">
            <Clock size={12} />
            {t.psychologist.testDurationMinutes.replace(
              "{n}",
              String(td.durationMinutes),
            )}
          </span>
        )}
        {td.ageRange && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-text-light">
            <GraduationCap size={12} />
            {t.psychologist.testAgeRangeGrades
              .replace("{from}", String(td.ageRange.minGrade))
              .replace("{to}", String(td.ageRange.maxGrade))}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-text-light">
          {td.questions.length} {language === "kz" ? "сұрақ" : "вопр."}
        </span>
      </div>

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

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-3 bg-gradient-to-t from-bg via-bg to-transparent z-30">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goAssign("student")}
            className="btn-press flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg hover:bg-primary-dark transition-colors"
          >
            {t.psychologist.assignToStudentBtn}
          </button>
          <button
            type="button"
            onClick={() => goAssign("class")}
            className="btn-press flex-1 h-11 rounded-xl bg-surface border border-primary text-primary text-sm font-semibold shadow-lg hover:bg-surface-hover transition-colors"
          >
            {t.psychologist.assignToClassBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
