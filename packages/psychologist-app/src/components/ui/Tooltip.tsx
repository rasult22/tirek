import { useState, type ReactNode } from "react";
import { clsx } from "clsx";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Default: top. */
  side?: "top" | "bottom";
  /** Delay before showing in ms. Default 200. */
  delay?: number;
}

export function Tooltip({ content, children, side = "top", delay = 200 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setOpen(true), delay));
  };
  const handleLeave = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={clsx(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50",
            "px-2.5 py-1.5 rounded-lg bg-ink text-white text-[11px] font-medium whitespace-nowrap",
            "shadow-lg",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
