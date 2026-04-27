import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useT } from "../hooks/useLanguage.js";
import { getFeed } from "../api/crisis.js";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";

export function DashboardPage() {
  const t = useT();
  const navigate = useNavigate();

  const { data: redData, isLoading: redLoading } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => getFeed("red"),
    refetchInterval: 30_000,
  });

  const redSignals = redData?.data ?? [];
  const redCount = redSignals.length;
  const showAllCalm = !redLoading && redSignals.length === 0;

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "<1m";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h1 className="text-xl font-bold tracking-tight text-text-main">
        {t.psychologist.dashboard}
      </h1>

      {showAllCalm ? (
        <div className="glass-card-elevated rounded-2xl py-10 px-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
            <Activity size={28} className="text-success" />
          </div>
          <h2 className="text-base font-bold text-text-main">
            {t.psychologist.dashboardAllCalmTitle}
          </h2>
          <p className="text-sm text-text-light mt-1">
            {t.psychologist.dashboardAllCalmHint}
          </p>
        </div>
      ) : (
        <div className="glass-card-elevated rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border-light">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10">
                <AlertTriangle size={14} className="text-danger" />
              </div>
              <h2 className="text-sm font-bold text-text-main">
                {t.psychologist.redFeedFull}
              </h2>
              {redCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-danger text-white">
                  {redCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/crisis")}
              className="btn-press text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors"
            >
              {t.common.more}
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="p-4">
            {redLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-text-light" />
              </div>
            ) : (
              <div className="space-y-2">
                {redSignals.slice(0, 5).map((signal) => (
                  <div
                    key={signal.id}
                    className="btn-press flex items-center gap-3 p-3 rounded-xl bg-danger/4 border border-danger/12 cursor-pointer hover:bg-danger/8 transition-all"
                    onClick={() => navigate("/crisis")}
                  >
                    <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-main truncate">
                        {signal.studentName}
                      </p>
                      <p className="text-xs text-text-light truncate">
                        {signal.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-text-light font-medium shrink-0">
                      <Clock size={11} />
                      {formatTimeAgo(signal.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
