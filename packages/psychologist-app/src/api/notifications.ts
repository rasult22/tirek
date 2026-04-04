import { apiFetch } from "./client.js";
import type { Notification, PaginatedResponse } from "@tirek/shared";

export function getNotifications() {
  return apiFetch<PaginatedResponse<Notification>>("/notifications");
}

export function getUnreadCount() {
  return apiFetch<{ count: number }>("/notifications/count");
}

export function markRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}
