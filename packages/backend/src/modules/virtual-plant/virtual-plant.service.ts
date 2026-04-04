import { virtualPlantRepository } from "./virtual-plant.repository.js";

const STAGE_THRESHOLDS = [0, 50, 150, 300] as const;

function computeStage(points: number): 1 | 2 | 3 | 4 {
  if (points >= 300) return 4;
  if (points >= 150) return 3;
  if (points >= 50) return 2;
  return 1;
}

function isSleeping(lastWateredAt: Date | null): boolean {
  if (!lastWateredAt) return false;
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return Date.now() - lastWateredAt.getTime() > twoDaysMs;
}

function getNextStageThreshold(stage: 1 | 2 | 3 | 4): number {
  if (stage >= 4) return STAGE_THRESHOLDS[3];
  return STAGE_THRESHOLDS[stage as 1 | 2 | 3];
}

export const virtualPlantService = {
  async getPlant(userId: string) {
    const plant = await virtualPlantRepository.getByUserId(userId);
    if (!plant) {
      return {
        growthPoints: 0,
        stage: 1 as const,
        name: null,
        lastWateredAt: null,
        isSleeping: false,
        pointsToNextStage: STAGE_THRESHOLDS[1],
        nextStageThreshold: STAGE_THRESHOLDS[1],
        createdAt: new Date().toISOString(),
      };
    }
    const stage = plant.stage as 1 | 2 | 3 | 4;
    const nextThreshold = getNextStageThreshold(stage);
    return {
      growthPoints: plant.growthPoints,
      stage,
      name: plant.name,
      lastWateredAt: plant.lastWateredAt?.toISOString() ?? null,
      isSleeping: isSleeping(plant.lastWateredAt),
      pointsToNextStage: stage >= 4 ? 0 : nextThreshold - plant.growthPoints,
      nextStageThreshold: nextThreshold,
      createdAt: plant.createdAt.toISOString(),
    };
  },

  async addPoints(userId: string, points: number) {
    const existing = await virtualPlantRepository.getByUserId(userId);
    const currentPoints = existing?.growthPoints ?? 0;
    const newPoints = currentPoints + points;
    const newStage = computeStage(newPoints);

    await virtualPlantRepository.upsert(userId, {
      growthPoints: newPoints,
      stage: newStage,
      lastWateredAt: new Date(),
    });
  },

  async renamePlant(userId: string, name: string) {
    const existing = await virtualPlantRepository.getByUserId(userId);
    if (!existing) {
      await virtualPlantRepository.upsert(userId, {
        growthPoints: 0,
        stage: 1,
        name: name.trim(),
        lastWateredAt: null,
      });
      return;
    }
    await virtualPlantRepository.updateName(userId, name.trim());
  },
};
