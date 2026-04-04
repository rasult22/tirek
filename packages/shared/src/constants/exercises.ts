import type { BreathingConfig } from "../types/index.js";

export const exerciseConfigs: Record<string, BreathingConfig> = {
  "square-breathing": {
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    shape: "square",
  },
  "breathing-478": {
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 3,
    shape: "circle",
  },
  diaphragmatic: {
    inhale: 4,
    exhale: 6,
    cycles: 5,
    shape: "balloon",
  },
};
