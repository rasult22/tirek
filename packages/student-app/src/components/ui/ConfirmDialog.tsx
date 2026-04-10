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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl animate-fade-in-up">
        <h3 className="text-base font-bold text-text-main">
          {title ?? t.common.confirmDelete}
        </h3>
        <p className="mt-2 text-sm text-text-light">
          {description ?? t.common.confirmDeleteDescription}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="btn-press flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold text-text-main transition-all hover:bg-surface-hover"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-press flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all ${
              variant === "danger"
                ? "bg-danger hover:bg-danger/90"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {confirmLabel ?? t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
