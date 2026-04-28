import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Clock, MessageCircle, AlertOctagon } from "lucide-react";
import type { OfficeHoursInfoBlock as Block } from "@tirek/shared";
import { useT } from "../hooks/useLanguage.js";
import { officeHoursApi } from "../api/office-hours.js";

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function statusLine(block: Block, t: ReturnType<typeof useT>): string {
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
    case "finished_today":
      return block.notes
        ? format(i.finishedTodayWithNotes, { lastEnd: block.lastEnd, notes: block.notes })
        : format(i.finishedToday, { lastEnd: block.lastEnd });
    case "day_off_today":
      return i.dayOffToday;
  }
}

function tomorrowLine(block: Block, t: ReturnType<typeof useT>): string | null {
  const i = t.officeHours.info;
  if (block.kind === "finished_today" || block.kind === "day_off_today") {
    if (block.tomorrowFrom && block.tomorrowUntil) {
      return format(i.tomorrowFromUntil, {
        from: block.tomorrowFrom,
        until: block.tomorrowUntil,
      });
    }
  }
  return null;
}

export function OfficeHoursInfoBlock() {
  const t = useT();
  const { data } = useQuery({
    queryKey: ["office-hours", "info-block"],
    queryFn: officeHoursApi.infoBlock,
    refetchInterval: 5 * 60 * 1000,
  });

  if (!data) return null;
  const tomorrow = tomorrowLine(data, t);

  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
          <Clock size={20} className="text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-main">{data.psychologist.name}</div>
          <div className="mt-0.5 text-sm text-text-main">{statusLine(data, t)}</div>
          {tomorrow && (
            <div className="mt-0.5 text-xs text-text-soft">{tomorrow}</div>
          )}
        </div>
      </div>

      <Link
        to="/messages"
        className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
      >
        <MessageCircle size={16} />
        {t.officeHours.info.messageCta}
      </Link>

      <div className="flex items-start gap-2 text-xs text-text-soft">
        <AlertOctagon size={14} className="mt-0.5 shrink-0 text-rose-500" />
        <p>
          {t.officeHours.info.crisisHint}
          <Link to="/sos" className="font-bold text-rose-600 underline-offset-2 hover:underline">
            {t.officeHours.info.crisisHintSos}
          </Link>
        </p>
      </div>
    </div>
  );
}
