import { AlertTriangle, RefreshCw } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";

interface ErrorStateProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({ onRetry, title, description }: ErrorStateProps) {
  const t = useT();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertTriangle size={32} className="text-danger" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-bold text-text-main">
        {title ?? t.common.errorTitle}
      </h3>
      <p className="mt-1.5 text-center text-sm text-text-light max-w-xs">
        {description ?? t.common.errorDescription}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-press mt-5 flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/15"
        >
          <RefreshCw size={16} />
          {t.common.retry}
        </button>
      )}
    </div>
  );
}
