import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import type { OfficeHoursInfoBlock as Block } from "@tirek/shared";
import { useT } from "../hooks/useLanguage.js";
import { officeHoursApi } from "../api/office-hours.js";

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function toText(block: Block, t: ReturnType<typeof useT>): string {
  const i = t.officeHours.info;
  switch (block.kind) {
    case "available_now":
      return block.notes
        ? format(i.availableNowWithNotes, { until: block.until, notes: block.notes })
        : format(i.availableNow, { until: block.until });
    case "available_later_today":
      return block.notes
        ? format(i.availableLaterTodayWithNotes, {
            from: block.from,
            until: block.until,
            notes: block.notes,
          })
        : format(i.availableLaterToday, { from: block.from, until: block.until });
    case "available_tomorrow":
      return block.notes
        ? format(i.availableTomorrowWithNotes, {
            from: block.from,
            until: block.until,
            notes: block.notes,
          })
        : format(i.availableTomorrow, { from: block.from, until: block.until });
    case "unavailable_today":
      return i.unavailableToday;
  }
}

export function OfficeHoursInfoBlock() {
  const t = useT();
  const { data } = useQuery({
    queryKey: ["office-hours", "info-block"],
    queryFn: officeHoursApi.infoBlock,
    refetchInterval: 5 * 60 * 1000,
  });

  if (!data) return null;

  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
        <Clock size={18} className="text-violet-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
          {t.officeHours.info.title}
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold text-text-main">
          {toText(data, t)}
        </div>
      </div>
    </div>
  );
}
