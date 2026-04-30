import { AlertCircle, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import { useT } from "../../hooks/useLanguage.js";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  variant = "danger",
}: ConfirmDialogProps) {
  const t = useT();

  if (!open) return null;

  const isDanger = variant === "danger";
  const Icon = isDanger ? AlertCircle : HelpCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <div
            className={clsx(
              "w-14 h-14 rounded-full flex items-center justify-center mb-3",
              isDanger ? "bg-danger/10 text-danger" : "bg-brand-soft text-brand-deep",
            )}
          >
            <Icon size={26} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-text-main">
            {title ?? t.common.confirmDelete}
          </h3>
          <p className="mt-1.5 text-sm text-text-light leading-relaxed">
            {description ?? t.common.confirmDeleteDescription}
          </p>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            className="btn-press flex-1 rounded-xl border border-border-light bg-surface py-2.5 text-sm font-semibold text-text-main transition-all hover:bg-surface-hover"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "btn-press flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all",
              isDanger
                ? "bg-danger hover:bg-danger/90"
                : "bg-primary hover:bg-primary-dark",
            )}
          >
            {confirmLabel ?? t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
