import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import { evaluate } from "../../lib/inactivity-signal/inactivity-signal.js";
import { inactivitySignalRepository } from "./inactivity-signal.repository.js";

const DEFAULT_THRESHOLD_DAYS = 3;

export const inactivitySignalService = {
  async getInactiveStudents(psychologistId: string, thresholdDays?: number) {
    const students = await inactivitySignalRepository.findStudentsWithLastActivity(psychologistId);
    return evaluate({
      students,
      thresholdDays: thresholdDays ?? DEFAULT_THRESHOLD_DAYS,
      today: currentDay(),
    });
  },
};
