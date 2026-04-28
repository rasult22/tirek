import { tirekClient } from "./client";
import type { TimelineEvent, TimelineEventType } from "@tirek/shared";

export type { TimelineEvent, TimelineEventType };

export const timelineApi = {
  getStudentTimeline: (
    studentId: string,
    opts?: { type?: TimelineEventType; limit?: number; offset?: number },
  ) => tirekClient.psychologist.timeline.getStudentTimeline(studentId, opts),
};
