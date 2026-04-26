import { virtualPlantRepository } from "./virtual-plant.repository.js";
import { achievementsService } from "../achievements/achievements.service.js";
import { computeStage, isSleeping, pointsToNextStage } from "../../lib/plant-growth/plant-growth.js";

export const virtualPlantService = {
  async getPlant(userId: string) {
    const plant = await virtualPlantRepository.getByUserId(userId);
    if (!plant) {
      const initialNextThreshold = pointsToNextStage(0);
      return {
        growthPoints: 0,
        stage: 1 as const,
        name: null,
        lastWateredAt: null,
        isSleeping: false,
        pointsToNextStage: initialNextThreshold,
        nextStageThreshold: initialNextThreshold,
        createdAt: new Date().toISOString(),
      };
    }
    const stage = plant.stage as 1 | 2 | 3 | 4;
    const nextThreshold = pointsToNextStage(plant.growthPoints);
    return {
      growthPoints: plant.growthPoints,
      stage,
      name: plant.name,
      lastWateredAt: plant.lastWateredAt?.toISOString() ?? null,
      isSleeping: isSleeping({ lastWateredAt: plant.lastWateredAt, now: new Date() }),
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
    achievementsService.checkAndAward(userId, { trigger: "plant", plantStage: newStage }).catch(() => {});
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
