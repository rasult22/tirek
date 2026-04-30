import { MoodChart } from "./MoodChart.js";
import type { MoodEntry } from "@tirek/shared";

interface MoodSparklineProps {
  data: { date: string; mood: number }[];
  average: number;
  latestEntry?: MoodEntry;
}

/** @deprecated Use <MoodChart size="inline" /> instead. */
export function MoodSparkline(props: MoodSparklineProps) {
  return <MoodChart {...props} size="inline" />;
}
