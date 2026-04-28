import { useNavigate } from "react-router";
import { ChevronRight, Clock, GraduationCap } from "lucide-react";
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
    <div className="space-y-2">
      {tests.map((td) => {
        const name = language === "kz" ? td.nameKz : td.nameRu;
        const description =
          language === "kz" ? td.descriptionKz : td.descriptionRu;
        const duration = (td as { durationMinutes?: number }).durationMinutes;
        const age = (td as {
          ageRange?: { minGrade: number; maxGrade: number };
        }).ageRange;

        return (
          <button
            key={td.slug}
            onClick={() => navigate(`/diagnostics/tests/${td.slug}`)}
            className="btn-press w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-border shadow-sm transition-all hover:shadow-md text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-main">{name}</div>
              <div className="mt-0.5 text-xs text-text-light line-clamp-2">
                {description}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-light">
                {duration != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} />
                    {t.psychologist.testDurationMinutes.replace(
                      "{n}",
                      String(duration),
                    )}
                  </span>
                )}
                {age && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={10} />
                    {t.psychologist.testAgeRangeGrades
                      .replace("{from}", String(age.minGrade))
                      .replace("{to}", String(age.maxGrade))}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-text-light/40 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
