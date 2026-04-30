import { Loader2, MessageSquare, ClipboardPlus, Printer } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";

interface StudentActionBarProps {
  onMessage: () => void;
  onAssignTest: () => void;
  onPrint: () => void;
  printing?: boolean;
  messaging?: boolean;
}

export function StudentActionBar({
  onMessage,
  onAssignTest,
  onPrint,
  printing,
  messaging,
}: StudentActionBarProps) {
  const t = useT();

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={onMessage}
        disabled={messaging}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand text-brand-fg
          text-sm font-medium hover:bg-brand-deep transition-colors btn-press disabled:opacity-60"
      >
        {messaging ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <MessageSquare size={14} />
        )}
        <span className="truncate">{t.directChat.writeToStudent}</span>
      </button>
      <button
        onClick={onAssignTest}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
          bg-surface border border-border text-sm font-medium text-ink
          hover:bg-surface-hover transition-colors btn-press"
      >
        <ClipboardPlus size={14} />
        <span className="truncate">{t.psychologist.assignTest}</span>
      </button>
      <button
        onClick={onPrint}
        disabled={printing}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
          bg-surface border border-border text-sm font-medium text-ink
          hover:bg-surface-hover transition-colors btn-press disabled:opacity-60"
      >
        {printing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Printer size={14} />
        )}
        <span className="truncate">{t.psychologist.printProfile}</span>
      </button>
    </div>
  );
}
