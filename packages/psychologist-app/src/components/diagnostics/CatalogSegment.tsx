import { useNavigate } from "react-router";
import { Clock, GraduationCap, ClipboardList } from "lucide-react";
import { testDefinitions } from "@tirek/shared";
import { useT, useLanguage } from "../../hooks/useLanguage.js";

export function CatalogSegment() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const tests = Object.values(testDefinitions);

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-sm text-text-light">{t.psychologist.testCatalogEmpty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {tests.map((td) => {
        const name = language === "kz" ? td.nameKz : td.nameRu;
        const description =
          language === "kz" ? td.descriptionKz : td.descriptionRu;
        const duration = (td as { durationMinutes?: number }).durationMinutes;
        const age = (td as {
          ageRange?: { minGrade: number; maxGrade: number };
        }).ageRange;
        const questionCount = (td as { questions?: ReadonlyArray<unknown> })
          .questions?.length;

        return (
          <button
            key={td.slug}
            onClick={() => navigate(`/diagnostics/tests/${td.slug}`)}
            className="btn-press group flex flex-col gap-2.5 p-4 rounded-2xl bg-surface border border-border-light hover:border-brand/40 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardList size={18} className="text-brand-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-text-main leading-tight">
                  {name}
                </div>
                <div className="mt-1 text-[12px] text-text-light line-clamp-2">
                  {description}
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-light pt-2 border-t border-border-light">
              {duration != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {t.psychologist.testDurationMinutes.replace(
                    "{n}",
                    String(duration),
                  )}
                </span>
              )}
              {age && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap size={11} />
                  {t.psychologist.testAgeRangeGrades
                    .replace("{from}", String(age.minGrade))
                    .replace("{to}", String(age.maxGrade))}
                </span>
              )}
              {questionCount != null && (
                <span className="inline-flex items-center gap-1">
                  {questionCount} {language === "kz" ? "сұрақ" : "вопр."}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
