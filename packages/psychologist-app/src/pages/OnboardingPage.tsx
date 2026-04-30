import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  Calendar,
  KeyRound,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Stepper, type StepperStep } from "../components/ui/Stepper.js";

interface OnboardingBlock {
  id: string;
  title: string;
  description: string;
  bullets: { icon: LucideIcon; text: string }[];
}

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(-1);

  const ob = t.psychologist.onboarding;

  // 4 grouped blocks instead of 8 atomic steps:
  // Welcome → Monitoring (dashboard+students+crisis) → Communication (messages+diagnostics) → Operations (office hours+codes)
  const blocks: OnboardingBlock[] = [
    {
      id: "monitoring",
      title: ob.step1Title,
      description: ob.step1Desc,
      bullets: [
        { icon: LayoutDashboard, text: ob.step1Title },
        { icon: Users, text: ob.step2Title },
        { icon: AlertTriangle, text: ob.step3Title },
      ],
    },
    {
      id: "communication",
      title: ob.step4Title,
      description: ob.step4Desc,
      bullets: [
        { icon: MessageSquare, text: ob.step4Title },
        { icon: ClipboardList, text: ob.step5Title },
      ],
    },
    {
      id: "operations",
      title: ob.step6Title,
      description: ob.step6Desc,
      bullets: [
        { icon: Calendar, text: ob.step6Title },
        { icon: KeyRound, text: ob.step7Title },
      ],
    },
  ];

  const stepperSteps: StepperStep[] = blocks.map((b) => ({
    id: b.id,
    label: b.title,
  }));

  const totalBlocks = blocks.length;
  const isWelcome = currentStep === -1;
  const isLastBlock = currentStep === totalBlocks - 1;

  const handleNext = useCallback(() => {
    if (isLastBlock) {
      onComplete();
      navigate("/", { replace: true });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLastBlock, onComplete, navigate]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(-1, s - 1));
  }, []);

  const handleSkip = useCallback(() => {
    onComplete();
    navigate("/", { replace: true });
  }, [onComplete, navigate]);

  // ── Welcome ────────────────────────────────────────────
  if (isWelcome) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto text-center animate-fade-in-up">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg mb-8">
            <Sparkles size={36} className="text-white" />
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-text-main mb-3">
            {ob.welcome}
          </h1>
          <p className="text-base text-text-light max-w-xl mx-auto mb-10 leading-relaxed">
            {ob.welcomeSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto">
            {blocks.map((b, i) => (
              <div
                key={b.id}
                className="rounded-2xl bg-surface border border-border-light p-4 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-brand-soft text-brand-deep text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-text-light">
                    {`Шаг ${i + 1}`}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-main">
                  {b.title}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleNext}
              className="btn-press inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-dark transition-all"
            >
              {t.common.next}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-sm text-text-light font-semibold hover:text-text-main transition-colors"
            >
              {ob.skip}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Block screen ─────────────────────────────────────
  const block = blocks[currentStep]!;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="btn-press w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft size={16} className="text-text-main" />
        </button>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-text-light hover:text-text-main transition-colors px-2 py-1"
        >
          {ob.skip}
        </button>
      </div>

      <div className="px-6 max-w-2xl mx-auto w-full mb-6">
        <Stepper steps={stepperSteps} current={currentStep} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        <div
          key={currentStep}
          className="max-w-xl w-full text-center animate-fade-in-up"
        >
          <h2 className="text-2xl lg:text-3xl font-extrabold text-text-main mb-3">
            {block.title}
          </h2>
          <p className="text-base text-text-light leading-relaxed mb-8">
            {block.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto">
            {block.bullets.map((b, i) => (
              <div
                key={i}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                  "bg-surface border border-border-light text-left",
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
                  <b.icon size={16} className="text-brand-deep" />
                </div>
                <span className="text-sm font-semibold text-text-main">
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 max-w-xl mx-auto w-full">
        <button
          onClick={handleNext}
          className="btn-press w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-dark transition-all"
        >
          {isLastBlock ? ob.letsStart : t.common.next}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
