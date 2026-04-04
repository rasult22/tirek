import { apiFetch } from "./client.js";
import type {
  AppointmentSlot,
  Appointment,
  PaginatedResponse,
} from "@tirek/shared";

export const appointmentsApi = {
  // Slots
  createSlots: (
    slots: Array<{ date: string; startTime: string; endTime: string }>,
  ) =>
    apiFetch<AppointmentSlot[]>("/psychologist/appointments/slots", {
      method: "POST",
      body: JSON.stringify({ slots }),
    }),

  getSlots: (from: string, to: string) =>
    apiFetch<AppointmentSlot[]>(
      `/psychologist/appointments/slots?from=${from}&to=${to}`,
    ),

  deleteSlot: (id: string) =>
    apiFetch<AppointmentSlot>(`/psychologist/appointments/slots/${id}`, {
      method: "DELETE",
    }),

  // Appointments
  list: (limit = 50) =>
    apiFetch<PaginatedResponse<Appointment>>(
      `/psychologist/appointments?limit=${limit}`,
    ),

  updateStatus: (id: string, status: string) =>
    apiFetch<Appointment>(`/psychologist/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
