import { paginated } from "../../shared/pagination.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { createTimelineModule } from "./timeline.js";
import type { TimelineEventType } from "./timeline.js";
import { timelineRepository } from "./timeline.repository.js";

const module = createTimelineModule({
  isStudentLinked: timelineRepository.isStudentLinked,
  findMoodEvents: timelineRepository.findMoodEvents,
  findTestEvents: timelineRepository.findTestEvents,
  findCbtEvents: timelineRepository.findCbtEvents,
  findMessageEvents: timelineRepository.findMessageEvents,
  findCrisisEvents: timelineRepository.findCrisisEvents,
});

export const timelineService = {
  async getStudentTimeline(
    psychologistId: string,
    studentId: string,
    pagination: PaginationParams,
    type: TimelineEventType | undefined,
  ) {
    const { data, total } = await module.getStudentTimeline(
      psychologistId,
      studentId,
      { ...pagination, type },
    );
    return paginated(data, total, pagination);
  },
};
