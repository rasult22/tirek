import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { notificationsService } from "./notifications.service.js";

const notificationsRouter = new Hono<{ Variables: AppVariables }>();

// GET /notifications - get recent notifications
notificationsRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await notificationsService.getNotifications(
      c.var.user.userId,
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /notifications/count - get unread count
notificationsRouter.get("/count", async (c) => {
  try {
    const result = await notificationsService.getUnreadCount(
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /notifications/:id/read - mark as read
notificationsRouter.patch("/:id/read", async (c) => {
  try {
    const result = await notificationsService.markAsRead(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { notificationsRouter };
