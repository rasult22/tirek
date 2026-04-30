interface DayDividerProps {
  /** Pre-formatted label, e.g. "Сегодня", "27 апреля". */
  label: string;
}

export function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border-light" />
      <span className="px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wide rounded-full bg-surface-secondary border border-border-light">
        {label}
      </span>
      <div className="flex-1 h-px bg-border-light" />
    </div>
  );
}
