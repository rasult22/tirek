import { tirekClient } from "./client.js";

export const getNotifications = () => tirekClient.notifications.list();

export const getUnreadCount = () => tirekClient.notifications.unreadCount();

export const markRead = (id: string) => tirekClient.notifications.markRead(id);
