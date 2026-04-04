import { useNavigate } from "react-router";
import { ArrowLeft, ClipboardList, ArrowRight } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { testDefinitions } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

const TEST_ICONS: Record<string, { bg: string; emoji: string }> = {
  "phq-a": { bg: "bg-primary/15", emoji: "💜" },
  "gad-7": { bg: "bg-accent/20", emoji: "🧡" },
  rosenberg: { bg: "bg-secondary/20", emoji: "💚" },
};

export function TestsListPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const tests = Object.values(testDefinitions);

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.tests.title}</h1>
        </div>

        {/* Test cards */}
        <div className="mt-6 space-y-4">
          {tests.map((test) => {
            const meta = TEST_ICONS[test.slug] ?? { bg: "bg-gray-100", emoji: "📋" };
            const name = language === "kz" ? test.nameKz : test.nameRu;
            const desc = language === "kz" ? test.descriptionKz : test.descriptionRu;

            return (
              <button
                key={test.slug}
                onClick={() => navigate(`/tests/${test.slug}`)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg}`}>
                  <span className="text-2xl">{meta.emoji}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-text-main">{name}</p>
                  <p className="mt-1 text-xs text-text-light">{desc}</p>
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
