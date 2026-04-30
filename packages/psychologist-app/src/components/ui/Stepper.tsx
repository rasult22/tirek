import { Check } from "lucide-react";
import { clsx } from "clsx";

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Index of the active step (0-based). */
  current: number;
  /** Allow clicking already-completed steps to navigate back. */
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <ol className="flex items-center w-full" aria-label="Steps">
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isActive = idx === current;
        const clickable = !!onStepClick && isDone;

        const circle = (
          <span
            className={clsx(
              "relative z-[1] w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-colors",
              isDone && "bg-brand text-white border-brand",
              isActive && "bg-surface text-brand border-brand",
              !isDone && !isActive && "bg-surface text-ink-muted border-border",
            )}
          >
            {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
          </span>
        );

        return (
          <li
            key={step.id}
            className={clsx("flex items-center", idx < steps.length - 1 && "flex-1")}
          >
            <div className="flex flex-col items-center min-w-0">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(idx)}
                  className="cursor-pointer"
                  aria-label={`Go to step ${idx + 1}: ${step.label}`}
                >
                  {circle}
                </button>
              ) : (
                circle
              )}
              <span
                className={clsx(
                  "mt-1.5 text-[11px] font-semibold truncate max-w-[90px] text-center",
                  isActive ? "text-ink" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={clsx(
                  "flex-1 h-px mx-2 -mt-5",
                  isDone ? "bg-brand" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
