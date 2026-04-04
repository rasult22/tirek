import {
  eq,
  and,
  desc,
  asc,
  count as dbCount,
  gte,
  lte,
  inArray,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  appointmentSlots,
  appointments,
  users,
  studentPsychologist,
} from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const appointmentsRepository = {
  // ── Slots ──────────────────────────────────────────────────────

  async createSlots(
    slots: Array<{
      id: string;
      psychologistId: string;
      date: string;
      startTime: string;
      endTime: string;
    }>,
  ) {
    return db.insert(appointmentSlots).values(slots).returning();
  },

  async findSlotById(id: string) {
    const [slot] = await db
      .select()
      .from(appointmentSlots)
      .where(eq(appointmentSlots.id, id))
      .limit(1);
    return slot ?? null;
  },

  async findSlotsByPsychologist(
    psychologistId: string,
    from: string,
    to: string,
  ) {
    return db
      .select()
      .from(appointmentSlots)
      .where(
        and(
          eq(appointmentSlots.psychologistId, psychologistId),
          gte(appointmentSlots.date, from),
          lte(appointmentSlots.date, to),
        ),
      )
      .orderBy(asc(appointmentSlots.date), asc(appointmentSlots.startTime));
  },

  async findAvailableSlots(
    psychologistId: string,
    from: string,
    to: string,
  ) {
    return db
      .select()
      .from(appointmentSlots)
      .where(
        and(
          eq(appointmentSlots.psychologistId, psychologistId),
          eq(appointmentSlots.isBooked, false),
          gte(appointmentSlots.date, from),
          lte(appointmentSlots.date, to),
        ),
      )
      .orderBy(asc(appointmentSlots.date), asc(appointmentSlots.startTime));
  },

  async deleteSlot(id: string) {
    const [deleted] = await db
      .delete(appointmentSlots)
      .where(eq(appointmentSlots.id, id))
      .returning();
    return deleted ?? null;
  },

  async markSlotBooked(id: string, booked: boolean) {
    const [updated] = await db
      .update(appointmentSlots)
      .set({ isBooked: booked })
      .where(eq(appointmentSlots.id, id))
      .returning();
    return updated ?? null;
  },

  // ── Appointments ───────────────────────────────────────────────

  async createAppointment(data: {
    id: string;
    slotId: string;
    studentId: string;
    psychologistId: string;
    studentNote?: string | null;
  }) {
    const [appt] = await db.insert(appointments).values(data).returning();
    return appt;
  },

  async findAppointmentById(id: string) {
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return appt ?? null;
  },

  async findAppointmentsByStudent(
    studentId: string,
    pagination: PaginationParams,
  ) {
    return db
      .select({
        id: appointments.id,
        slotId: appointments.slotId,
        studentId: appointments.studentId,
        psychologistId: appointments.psychologistId,
        status: appointments.status,
        studentNote: appointments.studentNote,
        psychologistNote: appointments.psychologistNote,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        date: appointmentSlots.date,
        startTime: appointmentSlots.startTime,
        endTime: appointmentSlots.endTime,
        psychologistName: users.name,
      })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .innerJoin(users, eq(appointments.psychologistId, users.id))
      .where(eq(appointments.studentId, studentId))
      .orderBy(desc(appointmentSlots.date), desc(appointmentSlots.startTime))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countAppointmentsByStudent(studentId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(appointments)
      .where(eq(appointments.studentId, studentId));
    return Number(row?.value ?? 0);
  },

  async findAppointmentsByPsychologist(
    psychologistId: string,
    pagination: PaginationParams,
  ) {
    return db
      .select({
        id: appointments.id,
        slotId: appointments.slotId,
        studentId: appointments.studentId,
        psychologistId: appointments.psychologistId,
        status: appointments.status,
        studentNote: appointments.studentNote,
        psychologistNote: appointments.psychologistNote,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        date: appointmentSlots.date,
        startTime: appointmentSlots.startTime,
        endTime: appointmentSlots.endTime,
        studentName: users.name,
        studentGrade: users.grade,
        studentClassLetter: users.classLetter,
      })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .innerJoin(users, eq(appointments.studentId, users.id))
      .where(eq(appointments.psychologistId, psychologistId))
      .orderBy(desc(appointmentSlots.date), desc(appointmentSlots.startTime))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countAppointmentsByPsychologist(psychologistId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(appointments)
      .where(eq(appointments.psychologistId, psychologistId));
    return Number(row?.value ?? 0);
  },

  async updateAppointmentStatus(id: string, status: string) {
    const [updated] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated ?? null;
  },

  async findStudentPsychologistLink(studentId: string) {
    const [link] = await db
      .select()
      .from(studentPsychologist)
      .where(eq(studentPsychologist.studentId, studentId))
      .limit(1);
    return link ?? null;
  },

  async findUpcomingByStudent(studentId: string, todayDate: string) {
    return db
      .select({
        id: appointments.id,
        status: appointments.status,
        date: appointmentSlots.date,
        startTime: appointmentSlots.startTime,
        endTime: appointmentSlots.endTime,
        psychologistName: users.name,
      })
      .from(appointments)
      .innerJoin(appointmentSlots, eq(appointments.slotId, appointmentSlots.id))
      .innerJoin(users, eq(appointments.psychologistId, users.id))
      .where(
        and(
          eq(appointments.studentId, studentId),
          gte(appointmentSlots.date, todayDate),
          inArray(appointments.status, ["scheduled", "confirmed"]),
        ),
      )
      .orderBy(asc(appointmentSlots.date), asc(appointmentSlots.startTime))
      .limit(1);
  },
};
