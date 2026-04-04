import { z } from "zod";

export const moodEntrySchema = z.object({
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
  factors: z.array(z.string()).optional(),
});
