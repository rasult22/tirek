import { NotFoundError } from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { notificationsRepository } from "./notifications.repository.js";

export const notificationsService = {
  async getNotifications(userId: string, pagination: PaginationParams) {
    const [items, total] = await Promise.all([
      notificationsRepository.findByUser(userId, pagination),
      notificationsRepository.countByUser(userId),
    ]);
    return paginated(items, total, pagination);
  },

  async getUnreadCount(userId: string) {
    const count = await notificationsRepository.countUnread(userId);
    return { count };
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await notificationsRepository.markRead(
      notificationId,
      userId,
    );
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }
    return notification;
  },
};
