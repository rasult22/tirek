import { apiFetch } from "./client";
import type { Notification, PaginatedResponse } from "@tirek/shared";

export const notificationsApi = {
  getAll: () =>
    apiFetch<PaginatedResponse<Notification>>("/notifications"),

  getUnreadCount: () =>
    apiFetch<{ count: number }>("/notifications/count"),

  markRead: (id: string) =>
    apiFetch<Notification>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
};
