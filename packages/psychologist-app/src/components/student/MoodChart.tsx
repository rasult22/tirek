import { useState, useRef } from "react";
import { useT, useLanguage } from "../../hooks/useLanguage.js";
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
  hero: { width: 640, height: 220, padX: 16, padY: 20, dotR: 5, strokeW: 2.5, maxHeight: 260 },
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
  const { language } = useLanguage();
  const dims = SIZE[size];
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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
  const hoverable = size === "hero";

  function handleMove(evt: React.MouseEvent<SVGSVGElement>) {
    if (!hoverable || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xRatio = (evt.clientX - rect.left) / rect.width;
    const xInVb = xRatio * width;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - xInVb);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    setHoverIdx(nearestIdx);
  }

  function handleLeave() {
    setHoverIdx(null);
  }

  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null;
  const locale = language === "kz" ? "kk-KZ" : "ru-RU";
  const hoverDateLabel = hoverPoint
    ? new Date(hoverPoint.date).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })
    : null;

  const tipW = 110;
  const tipH = 38;
  let tipX = hoverPoint ? hoverPoint.x - tipW / 2 : 0;
  if (tipX < padX) tipX = padX;
  if (tipX + tipW > width - padX) tipX = width - padX - tipW;
  const tipY = hoverPoint
    ? hoverPoint.y - tipH - 10 < padY
      ? hoverPoint.y + 12
      : hoverPoint.y - tipH - 10
    : 0;

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
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: dims.maxHeight }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
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

        {hoverPoint && (
          <>
            <line
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={padY}
              y2={padY + chartH}
              stroke="var(--brand)"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={dims.dotR + 3}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="1.5"
              opacity="0.5"
            />
            <g pointerEvents="none">
              <rect
                x={tipX}
                y={tipY}
                width={tipW}
                height={tipH}
                rx="6"
                fill="var(--ink)"
                opacity="0.92"
              />
              <text
                x={tipX + tipW / 2}
                y={tipY + 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--on-dark)"
              >
                {hoverDateLabel}
              </text>
              <text
                x={tipX + tipW / 2}
                y={tipY + 30}
                textAnchor="middle"
                fontSize="11"
                fill="var(--on-dark-mute)"
              >
                {moodEmojis[hoverPoint.mood]} {hoverPoint.mood}/5
              </text>
            </g>
          </>
        )}
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
