import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { virtualPlantService } from "./virtual-plant.service.js";

export const virtualPlantRouter = new Hono<{ Variables: AppVariables }>();

// GET / — get plant info for authenticated user
virtualPlantRouter.get("/", async (c) => {
  try {
    const result = await virtualPlantService.getPlant(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /name — rename the plant
virtualPlantRouter.patch("/name", async (c) => {
  try {
    const body = await c.req.json<{ name?: string }>();
    const name = body.name?.trim();
    if (!name || name.length === 0 || name.length > 50) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "Name must be 1-50 characters" } },
        400,
      );
    }
    await virtualPlantService.renamePlant(c.var.user.userId, name);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});
