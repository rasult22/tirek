import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { testDefinitions } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

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
};

export function TestsListPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const tests = Object.values(testDefinitions);

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

        {/* Test cards */}
        <div className="mt-6 space-y-3 stagger-children">
          {tests.map((test) => {
            const meta = TEST_ICONS[test.slug] ?? { iconBg: "bg-gray-100", emoji: "\u{1F4CB}" };
            const name = language === "kz" ? test.nameKz : test.nameRu;
            const desc = language === "kz" ? test.descriptionKz : test.descriptionRu;

            return (
              <button
                key={test.slug}
                onClick={() => navigate(`/tests/${test.slug}`)}
                className="btn-press flex w-full items-center gap-4 rounded-2xl bg-white border border-border-light p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}>
                  <span className="text-2xl">{meta.emoji}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-text-main">{name}</p>
                  <p className="mt-0.5 text-xs text-text-light line-clamp-2">{desc}</p>
                  <p className="mt-1.5 text-[10px] font-bold text-primary-dark">
                    {test.questions.length} {t.tests.question.toLowerCase()}
                  </p>
                </div>
                <ArrowRight size={18} className="text-text-light" />
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
