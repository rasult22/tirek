import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { userPlants } from "../../db/schema.js";

export const virtualPlantRepository = {
  async getByUserId(userId: string) {
    const [row] = await db
      .select()
      .from(userPlants)
      .where(eq(userPlants.userId, userId))
      .limit(1);
    return row ?? null;
  },

  async upsert(
    userId: string,
    data: {
      growthPoints: number;
      stage: number;
      name?: string | null;
      lastWateredAt?: Date | null;
    },
  ) {
    const [row] = await db
      .insert(userPlants)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userPlants.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  },

  async updateName(userId: string, name: string) {
    const [row] = await db
      .update(userPlants)
      .set({ name, updatedAt: new Date() })
      .where(eq(userPlants.userId, userId))
      .returning();
    return row ?? null;
  },
};
