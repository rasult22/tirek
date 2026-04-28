import { NotFoundError } from "../../shared/errors.js";

export type TimelineEvent =
  | {
      id: string;
      type: "mood";
      occurredAt: Date;
      payload: { mood: number; note: string | null };
    }
  | {
      id: string;
      type: "test";
      occurredAt: Date;
      payload: {
        sessionId: string;
        testSlug: string;
        testName: string;
        severity: string | null;
      };
    }
  | {
      id: string;
      type: "cbt";
      occurredAt: Date;
      payload: { cbtType: string; summary: string };
    }
  | {
      id: string;
      type: "message";
      occurredAt: Date;
      payload: {
        direction: "from_student" | "from_psychologist";
        preview: string;
      };
    }
  | {
      id: string;
      type: "crisis";
      occurredAt: Date;
      payload: {
        signalType: string;
        severity: string;
        summary: string;
      };
    }
  | {
      id: string;
      type: "assignment_cancelled";
      occurredAt: Date;
      payload: {
        assignmentId: string;
        testSlug: string;
        testName: string;
      };
    };

export type TimelineEventType = TimelineEvent["type"];

export interface TimelineQuery {
  limit: number;
  offset: number;
  type?: TimelineEventType;
}

export interface TimelineModuleDeps {
  isStudentLinked: (studentId: string, psychologistId: string) => Promise<boolean>;
  findMoodEvents: (studentId: string) => Promise<TimelineEvent[]>;
  findTestEvents: (studentId: string) => Promise<TimelineEvent[]>;
  findCbtEvents: (studentId: string) => Promise<TimelineEvent[]>;
  findMessageEvents: (
    studentId: string,
    psychologistId: string,
  ) => Promise<TimelineEvent[]>;
  findCrisisEvents: (studentId: string) => Promise<TimelineEvent[]>;
  findAssignmentCancelledEvents: (studentId: string) => Promise<TimelineEvent[]>;
}

export interface TimelineModule {
  getStudentTimeline: (
    psychologistId: string,
    studentId: string,
    query: TimelineQuery,
  ) => Promise<{ data: TimelineEvent[]; total: number }>;
}

export function createTimelineModule(deps: TimelineModuleDeps): TimelineModule {
  return {
    async getStudentTimeline(psychologistId, studentId, query) {
      const linked = await deps.isStudentLinked(studentId, psychologistId);
      if (!linked) {
        throw new NotFoundError(
          "Student not found or not linked to this psychologist",
        );
      }

      const sources: Record<
        TimelineEventType,
        () => Promise<TimelineEvent[]>
      > = {
        mood: () => deps.findMoodEvents(studentId),
        test: () => deps.findTestEvents(studentId),
        cbt: () => deps.findCbtEvents(studentId),
        message: () => deps.findMessageEvents(studentId, psychologistId),
        crisis: () => deps.findCrisisEvents(studentId),
        assignment_cancelled: () =>
          deps.findAssignmentCancelledEvents(studentId),
      };

      const wanted: TimelineEventType[] = query.type
        ? [query.type]
        : (Object.keys(sources) as TimelineEventType[]);

      const buckets = await Promise.all(wanted.map((t) => sources[t]()));
      const merged = buckets
        .flat()
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

      const page = merged.slice(query.offset, query.offset + query.limit);
      return { data: page, total: merged.length };
    },
  };
}
