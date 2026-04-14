import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fade-in-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Icon size={32} className="text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-bold text-text-main text-center">{title}</h3>
      {description && (
        <p className="mt-1.5 text-center text-sm text-text-light max-w-xs">{description}</p>
      )}
    </div>
  );
}
