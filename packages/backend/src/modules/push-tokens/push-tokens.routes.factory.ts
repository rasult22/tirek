import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import type { PushTokensService } from "./push-tokens.factory.js";

// Один router: и студент, и психолог регистрируют токены через одну и ту же
// логику. Дифференциация по c.var.user.role не нужна — токен принадлежит юзеру,
// независимо от роли. Точка монтирования (/student/push-token vs /psychologist/push-token)
// решается app.ts.

export function createPushTokensRouter(service: PushTokensService) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/", async (c) => {
    try {
      const body = await c.req.json();
      const row = await service.register(c.var.user.userId, {
        token: body.token,
        platform: body.platform,
      });
      return c.json({ ok: true, token: row.token }, 201);
    } catch (err) {
      return handleError(c, err);
    }
  });

  router.delete("/:token", async (c) => {
    try {
      await service.removeToken(c.req.param("token"));
      return c.json({ ok: true });
    } catch (err) {
      return handleError(c, err);
    }
  });

  return router;
}
