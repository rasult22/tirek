import { useState } from "react";
import { useNavigate } from "react-router";
import { SmilePlus, MessageCircle, Wind, ArrowRight } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";

const icons = [SmilePlus, MessageCircle, Wind];
const colors = ["bg-primary/20", "bg-secondary/20", "bg-accent/20"];
const iconColors = ["text-primary-dark", "text-secondary", "text-accent"];

export function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const steps = [
    { title: t.onboarding.step1Title, desc: t.onboarding.step1Desc },
    { title: t.onboarding.step2Title, desc: t.onboarding.step2Desc },
    { title: t.onboarding.step3Title, desc: t.onboarding.step3Desc },
  ];

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate("/");
    }
  };

  const Icon = icons[current];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      {/* Card */}
      <div className="w-full max-w-sm">
        <div className={`mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-3xl ${colors[current]} transition-colors duration-300`}>
          <Icon size={56} className={`${iconColors[current]} transition-colors duration-300`} strokeWidth={1.8} />
        </div>

        <h2 className="text-center text-2xl font-extrabold text-text-main">
          {steps[current].title}
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-text-light">
          {steps[current].desc}
        </p>
      </div>

      {/* Dots */}
      <div className="mt-10 flex gap-2">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all ${
              idx === current ? "w-8 bg-primary-dark" : "w-2.5 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Button */}
      <button
        onClick={handleNext}
        className="mt-10 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all"
      >
        {current === steps.length - 1 ? t.onboarding.getStarted : t.common.next}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
