import { v4 as uuidv4 } from "uuid";
import { appointmentsRepository } from "./appointments.repository.js";
import { notificationsRepository } from "../notifications/notifications.repository.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../shared/errors.js";
import { paginated, type PaginationParams } from "../../shared/pagination.js";

export const appointmentsService = {
  // ── Psychologist: Slot management ──────────────────────────────

  async createSlots(
    psychologistId: string,
    slots: Array<{ date: string; startTime: string; endTime: string }>,
  ) {
    if (!slots || !slots.length) {
      throw new ValidationError("At least one slot is required");
    }

    for (const s of slots) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date))
        throw new ValidationError("Invalid date format, expected YYYY-MM-DD");
      if (!/^\d{2}:\d{2}$/.test(s.startTime))
        throw new ValidationError("Invalid start time format, expected HH:mm");
      if (!/^\d{2}:\d{2}$/.test(s.endTime))
        throw new ValidationError("Invalid end time format, expected HH:mm");
      if (s.startTime >= s.endTime)
        throw new ValidationError("End time must be after start time");
    }

    const slotsWithIds = slots.map((s) => ({
      id: uuidv4(),
      psychologistId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return appointmentsRepository.createSlots(slotsWithIds);
  },

  async getSlots(psychologistId: string, from: string, to: string) {
    if (!from || !to)
      throw new ValidationError("from and to query params are required");
    return appointmentsRepository.findSlotsByPsychologist(
      psychologistId,
      from,
      to,
    );
  },

  async deleteSlot(psychologistId: string, slotId: string) {
    const slot = await appointmentsRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.psychologistId !== psychologistId)
      throw new ForbiddenError("Not your slot");
    if (slot.isBooked)
      throw new ConflictError("Cannot delete a booked slot");
    return appointmentsRepository.deleteSlot(slotId);
  },

  // ── Psychologist: Appointment management ───────────────────────

  async getPsychologistAppointments(
    psychologistId: string,
    pagination: PaginationParams,
  ) {
    const [rows, total] = await Promise.all([
      appointmentsRepository.findAppointmentsByPsychologist(
        psychologistId,
        pagination,
      ),
      appointmentsRepository.countAppointmentsByPsychologist(psychologistId),
    ]);
    return paginated(rows, total, pagination);
  },

  async updateStatus(
    psychologistId: string,
    appointmentId: string,
    status: string,
  ) {
    const validStatuses = ["confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status))
      throw new ValidationError("Invalid status");

    const appt =
      await appointmentsRepository.findAppointmentById(appointmentId);
    if (!appt) throw new NotFoundError("Appointment not found");
    if (appt.psychologistId !== psychologistId)
      throw new ForbiddenError("Not your appointment");

    const updated = await appointmentsRepository.updateAppointmentStatus(
      appointmentId,
      status,
    );

    if (status === "cancelled") {
      await appointmentsRepository.markSlotBooked(appt.slotId, false);
      notificationsRepository
        .create({
          id: uuidv4(),
          userId: appt.studentId,
          type: "appointment",
          title: "Приём отменён",
          body: "Психолог отменил ваш приём",
          metadata: { appointmentId },
        })
        .catch((err: unknown) =>
          console.error("Notification error:", err),
        );
    }

    if (status === "confirmed") {
      notificationsRepository
        .create({
          id: uuidv4(),
          userId: appt.studentId,
          type: "appointment",
          title: "Приём подтверждён",
          body: "Психолог подтвердил ваш приём",
          metadata: { appointmentId },
        })
        .catch((err: unknown) =>
          console.error("Notification error:", err),
        );
    }

    return updated;
  },

  // ── Student: Browse & book ─────────────────────────────────────

  async getAvailableSlots(studentId: string, from: string, to: string) {
    if (!from || !to)
      throw new ValidationError("from and to query params are required");

    const link =
      await appointmentsRepository.findStudentPsychologistLink(studentId);
    if (!link) throw new NotFoundError("No psychologist assigned");

    return appointmentsRepository.findAvailableSlots(
      link.psychologistId,
      from,
      to,
    );
  },

  async bookAppointment(
    studentId: string,
    body: { slotId: string; note?: string },
  ) {
    if (!body.slotId) throw new ValidationError("slotId is required");

    const slot = await appointmentsRepository.findSlotById(body.slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.isBooked) throw new ConflictError("Slot is already booked");

    const link =
      await appointmentsRepository.findStudentPsychologistLink(studentId);
    if (!link || link.psychologistId !== slot.psychologistId) {
      throw new ForbiddenError("Not linked to this psychologist");
    }

    await appointmentsRepository.markSlotBooked(slot.id, true);

    const appointment = await appointmentsRepository.createAppointment({
      id: uuidv4(),
      slotId: slot.id,
      studentId,
      psychologistId: slot.psychologistId,
      studentNote: body.note?.trim() || null,
    });

    notificationsRepository
      .create({
        id: uuidv4(),
        userId: slot.psychologistId,
        type: "appointment",
        title: "Новая запись на приём",
        body: "Ученик записался на приём",
        metadata: { appointmentId: appointment.id },
      })
      .catch((err: unknown) =>
        console.error("Notification error:", err),
      );

    return appointment;
  },

  async getStudentAppointments(
    studentId: string,
    pagination: PaginationParams,
  ) {
    const [rows, total] = await Promise.all([
      appointmentsRepository.findAppointmentsByStudent(studentId, pagination),
      appointmentsRepository.countAppointmentsByStudent(studentId),
    ]);
    return paginated(rows, total, pagination);
  },

  async cancelAppointment(studentId: string, appointmentId: string) {
    const appt =
      await appointmentsRepository.findAppointmentById(appointmentId);
    if (!appt) throw new NotFoundError("Appointment not found");
    if (appt.studentId !== studentId)
      throw new ForbiddenError("Not your appointment");
    if (appt.status === "cancelled")
      throw new ConflictError("Already cancelled");

    await appointmentsRepository.updateAppointmentStatus(
      appointmentId,
      "cancelled",
    );
    await appointmentsRepository.markSlotBooked(appt.slotId, false);

    notificationsRepository
      .create({
        id: uuidv4(),
        userId: appt.psychologistId,
        type: "appointment",
        title: "Приём отменён",
        body: "Ученик отменил запись на приём",
        metadata: { appointmentId },
      })
      .catch((err: unknown) =>
        console.error("Notification error:", err),
      );

    return { ok: true };
  },

  // ── Dashboard widget ───────────────────────────────────────────

  async getNextAppointment(studentId: string) {
    const today = new Date().toISOString().split("T")[0]!;
    const rows = await appointmentsRepository.findUpcomingByStudent(
      studentId,
      today,
    );
    return rows[0] ?? null;
  },
};
