import { useState, useRef, useEffect } from "react";
import { MoreVertical, Download, UserMinus } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";

interface ActionMenuProps {
  onExportCSV: () => void;
  onDetach: () => void;
}

export function ActionMenu({ onExportCSV, onDetach }: ActionMenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg border border-input-border text-text-light hover:bg-surface-hover transition-colors"
        aria-label={t.psychologist.studentDetail.moreActions}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl border border-border shadow-lg z-20 py-1 animate-fade-in-up">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-main hover:bg-surface-hover transition-colors"
          >
            <Download size={14} className="text-text-light" />
            {t.psychologist.studentDetail.exportCSV}
          </button>
          <div className="border-t border-border-light mx-2" />
          <button
            onClick={() => { onDetach(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
          >
            <UserMinus size={14} />
            {t.psychologist.detachStudent}
          </button>
        </div>
      )}
    </div>
  );
}
