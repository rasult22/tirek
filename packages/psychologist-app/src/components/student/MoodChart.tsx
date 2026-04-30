import { useT } from "../../hooks/useLanguage.js";
import type { MoodEntry } from "@tirek/shared";

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

const dotColors: Record<number, string> = {
  1: "var(--danger)",
  2: "var(--warning)",
  3: "var(--warning)",
  4: "var(--success)",
  5: "var(--success)",
};

export type MoodChartSize = "inline" | "hero";

const SIZE: Record<
  MoodChartSize,
  { width: number; height: number; padX: number; padY: number; dotR: number; strokeW: number; maxHeight: number }
> = {
  inline: { width: 320, height: 72, padX: 12, padY: 10, dotR: 3.5, strokeW: 2, maxHeight: 80 },
  hero: { width: 640, height: 200, padX: 16, padY: 16, dotR: 5, strokeW: 2.5, maxHeight: 240 },
};

interface MoodChartProps {
  data: { date: string; mood: number }[];
  average: number;
  latestEntry?: MoodEntry;
  /** "inline" — sparkline in dashboard rows; "hero" — large chart for StudentDetail. */
  size?: MoodChartSize;
  /** Range label override (e.g. "30 дней"). Defaults to t.studentDetail.days14. */
  rangeLabel?: string;
}

export function MoodChart({
  data,
  average,
  latestEntry,
  size = "inline",
  rangeLabel,
}: MoodChartProps) {
  const t = useT();
  const dims = SIZE[size];

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <p className="text-sm text-text-light text-center py-4">
          {t.psychologist.studentDetail.noMoodData}
        </p>
      </div>
    );
  }

  const { width, height, padX, padY } = dims;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? padX + chartW / 2 : padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - ((d.mood - 1) / 4) * chartH;
    return { x, y, mood: d.mood, date: d.date };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath = [
    `M ${points[0].x},${padY + chartH}`,
    `L ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`,
    `L ${points[points.length - 1].x},${padY + chartH}`,
    "Z",
  ].join(" ");

  const headerSizeClass = size === "hero" ? "text-base" : "text-sm";

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${headerSizeClass} font-semibold text-text-main`}>
          {t.psychologist.studentDetail.moodTrend} (
          {rangeLabel ?? t.psychologist.studentDetail.days14})
        </h3>
        <span className="text-xs font-medium text-text-light">
          {t.psychologist.studentDetail.average}: {average.toFixed(1)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: dims.maxHeight }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`moodFill-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[1, 2, 3, 4, 5].map((level) => {
          const y = padY + chartH - ((level - 1) / 4) * chartH;
          return (
            <line
              key={level}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--hairline)"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
          );
        })}

        <path d={areaPath} fill={`url(#moodFill-${size})`} />

        <polyline
          points={polyline}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={dims.strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={dims.dotR}
            fill={dotColors[p.mood] ?? "var(--brand)"}
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {latestEntry && (
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border-light">
          <span className="text-lg">{moodEmojis[latestEntry.mood] ?? "—"}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-light">
            <span>
              <span className="font-medium text-text-main">
                {t.psychologist.studentDetail.currentMood}:
              </span>{" "}
              {latestEntry.mood}/5
            </span>
            {latestEntry.energy != null && (
              <span>
                <span className="font-medium text-text-main">
                  {t.psychologist.studentDetail.energy}:
                </span>{" "}
                {latestEntry.energy}/5
              </span>
            )}
            {latestEntry.stressLevel != null && (
              <span>
                <span className="font-medium text-text-main">
                  {t.psychologist.studentDetail.stress}:
                </span>{" "}
                {latestEntry.stressLevel}/5
              </span>
            )}
            {latestEntry.sleepQuality != null && (
              <span>
                <span className="font-medium text-text-main">
                  {t.psychologist.studentDetail.sleep}:
                </span>{" "}
                {latestEntry.sleepQuality}/5
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
