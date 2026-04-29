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
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface OnboardingStep {
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

const BRAND_GRADIENT = "from-primary to-primary-dark";
const BRAND_ACCENT = "bg-primary";

const STEP_STYLES: OnboardingStep[] = [
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  Calendar,
  KeyRound,
  BarChart3,
].map((icon) => ({
  icon,
  gradient: BRAND_GRADIENT,
  iconBg: "bg-white/20",
  iconColor: "text-white",
  accentColor: BRAND_ACCENT,
}));

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen

  const ob = t.psychologist.onboarding;

  const steps = [
    { title: ob.step1Title, desc: ob.step1Desc },
    { title: ob.step2Title, desc: ob.step2Desc },
    { title: ob.step3Title, desc: ob.step3Desc },
    { title: ob.step4Title, desc: ob.step4Desc },
    { title: ob.step5Title, desc: ob.step5Desc },
    { title: ob.step6Title, desc: ob.step6Desc },
    { title: ob.step7Title, desc: ob.step7Desc },
    { title: ob.step8Title, desc: ob.step8Desc },
  ];

  const totalSteps = steps.length;
  const isWelcome = currentStep === -1;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
      navigate("/", { replace: true });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLastStep, onComplete, navigate]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(-1, s - 1));
  }, []);

  const handleSkip = useCallback(() => {
    onComplete();
    navigate("/", { replace: true });
  }, [onComplete, navigate]);

  // Welcome screen
  if (isWelcome) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Logo area */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg glow-primary">
              <Sparkles size={36} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-text-main text-center mb-2">
            {ob.welcome}
          </h1>
          <p className="text-sm text-text-light text-center mb-10 leading-relaxed">
            {ob.welcomeSubtitle}
          </p>

          {/* Feature preview grid */}
          <div className="grid grid-cols-4 gap-3 mb-10">
            {STEP_STYLES.map((style, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm",
                    style.gradient,
                  )}
                >
                  <style.icon size={20} className="text-white" />
                </div>
                <span className="text-[9px] font-semibold text-text-light text-center leading-tight">
                  {steps[i].title}
                </span>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={handleNext}
            className="btn-press w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:shadow-xl"
          >
            {t.common.next}
            <ArrowRight size={16} />
          </button>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full mt-3 py-2 text-sm text-text-light font-medium hover:text-text-main transition-colors"
          >
            {ob.skip}
          </button>
        </div>
      </div>
    );
  }

  // Step screens
  const style = STEP_STYLES[currentStep];
  const step = steps[currentStep];
  const Icon = style.icon;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header with progress */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="btn-press w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft size={16} className="text-text-main" />
        </button>

        <span className="text-xs font-bold text-text-light">
          {currentStep + 1} {ob.stepOf} {totalSteps}
        </span>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-text-light hover:text-text-main transition-colors px-2 py-1"
        >
          {ob.skip}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
              style.gradient,
            )}
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6" key={currentStep}>
        {/* Icon */}
        <div className="animate-fade-in-up mb-8">
          <div
            className={clsx(
              "w-28 h-28 rounded-[2rem] bg-gradient-to-br flex items-center justify-center shadow-xl",
              style.gradient,
            )}
          >
            <Icon size={48} className="text-white" strokeWidth={1.6} />
          </div>
        </div>

        {/* Text */}
        <div className="animate-fade-in-up max-w-xs text-center" style={{ animationDelay: "0.05s" }}>
          <h2 className="text-xl font-extrabold text-text-main mb-3">
            {step.title}
          </h2>
          <p className="text-sm text-text-light leading-relaxed">
            {step.desc}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-5 pb-6 safe-bottom">
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentStep
                  ? clsx("w-6", style.accentColor)
                  : i < currentStep
                    ? "w-1.5 bg-text-light/30"
                    : "w-1.5 bg-text-light/15",
              )}
            />
          ))}
        </div>

        {/* Next / Finish button */}
        <button
          onClick={handleNext}
          className={clsx(
            "btn-press w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:shadow-xl text-white bg-gradient-to-r",
            style.gradient,
          )}
        >
          {isLastStep ? ob.letsStart : t.common.next}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
