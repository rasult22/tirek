import { tirekClient } from "./client";

export const notificationsApi = {
  getAll: () => tirekClient.notifications.list(),
  getUnreadCount: () => tirekClient.notifications.unreadCount(),
  markRead: (id: string) => tirekClient.notifications.markRead(id),
};
