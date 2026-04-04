import { apiFetch } from "./client.js";
import type {
  AppointmentSlot,
  Appointment,
  UpcomingAppointment,
  PaginatedResponse,
} from "@tirek/shared";

export const appointmentsApi = {
  availableSlots: (from: string, to: string) =>
    apiFetch<AppointmentSlot[]>(
      `/student/appointments/slots?from=${from}&to=${to}`,
    ),

  book: (slotId: string, note?: string) =>
    apiFetch<Appointment>("/student/appointments", {
      method: "POST",
      body: JSON.stringify({ slotId, note }),
    }),

  list: () =>
    apiFetch<PaginatedResponse<Appointment>>(
      "/student/appointments?limit=50",
    ),

  cancel: (id: string) =>
    apiFetch<{ ok: boolean }>(`/student/appointments/${id}`, {
      method: "DELETE",
    }),

  next: () =>
    apiFetch<UpcomingAppointment | null>("/student/appointments/next"),
};
