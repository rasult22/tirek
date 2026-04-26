import { db } from "../../db/index.js";
import { sosEvents } from "../../db/schema.js";

export const sosRepository = {
  async create(data: {
    id: string;
    userId: string;
    type: "breathing" | "hotline" | "chat" | "urgent";
    createdAt: Date;
  }) {
    const [event] = await db
      .insert(sosEvents)
      .values({
        id: data.id,
        userId: data.userId,
        type: data.type,
        createdAt: data.createdAt,
      })
      .returning();
    return event;
  },
};
