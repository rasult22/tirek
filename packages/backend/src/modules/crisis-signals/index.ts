import { NotFoundError, ValidationError } from "../../shared/errors.js";

export type CrisisSignalType = "acute_crisis" | "concern";
export type CrisisSignalSeverity = "high" | "medium" | "low";
export type CrisisSignalSource = "urgent_help" | "ai_friend" | "test_session";

export type AiFriendCategory =
  | "bullying"
  | "family"
  | "self_esteem"
  | "academic"
  | "social_isolation"
  | "anxiety"
  | "violence"
  | "other";

export type FlaggedItem = {
  questionIndex: number;
  reason: string;
  answer?: number;
};

export type PersistedCrisisSignal = {
  id: string;
  studentId: string;
  type: CrisisSignalType;
  severity: CrisisSignalSeverity;
  source: CrisisSignalSource;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type CrisisSignalRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  studentClassLetter: string | null;
  type: CrisisSignalType;
  severity: CrisisSignalSeverity;
  source: CrisisSignalSource;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
  // Test-only convenience: real repo enforces ownership via JOIN.
  linkedPsychologistIds: string[];
};

export type ResolveInput = {
  resolvedAt: Date;
  resolvedBy: string;
  notes: string | null;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
};

export type FeedFilter = { feed: "red" | "yellow" };

export type ResolveBody = {
  notes?: string | null;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
};

export type CrisisSignalInput =
  | {
      source: "urgent_help";
      userId: string;
      metadata?: Record<string, unknown>;
    }
  | {
      source: "ai_friend";
      userId: string;
      conversationId: string;
      type: CrisisSignalType;
      severity: CrisisSignalSeverity;
      summary: string;
      category?: AiFriendCategory;
      markers?: string[];
    }
  | {
      source: "test_session";
      userId: string;
      testSessionId: string;
      testSlug: string;
      testSeverity: "severe";
      flaggedItems: FlaggedItem[];
    };

export type CrisisSignalsModuleDeps = {
  saveSignal: (signal: PersistedCrisisSignal) => Promise<string>;
  findPsychologistIdsForStudent: (studentId: string) => Promise<string[]>;
  findActiveByPsychologistAndType: (
    psychologistId: string,
    type: CrisisSignalType,
  ) => Promise<CrisisSignalRow[]>;
  findHistoryByPsychologist: (psychologistId: string) => Promise<CrisisSignalRow[]>;
  findById: (id: string, psychologistId: string) => Promise<CrisisSignalRow | null>;
  resolveSignal: (id: string, input: ResolveInput) => Promise<CrisisSignalRow>;
  logger: { warn: (msg: string, ctx?: Record<string, unknown>) => void };
  now: () => Date;
  newId: () => string;
};

const SEVERITY_RANK: Record<CrisisSignalSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

type NormalizedSignal = {
  type: CrisisSignalType;
  severity: CrisisSignalSeverity;
  source: CrisisSignalSource;
  summary: string;
  metadata: Record<string, unknown> | null;
};

function normalize(input: CrisisSignalInput): NormalizedSignal {
  switch (input.source) {
    case "ai_friend":
      return {
        type: input.type,
        severity: input.severity,
        source: "ai_friend",
        summary: input.summary,
        metadata: {
          conversationId: input.conversationId,
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.markers !== undefined ? { markers: input.markers } : {}),
        },
      };
    case "urgent_help":
      return {
        type: "acute_crisis",
        severity: "high",
        source: "urgent_help",
        summary: "Ученик нажал «Мне срочно плохо»",
        metadata: input.metadata ?? null,
      };
    case "test_session": {
      const flaggedReasons = input.flaggedItems.map((f) => f.reason).join(", ");
      const summary = flaggedReasons
        ? `Test "${input.testSlug}": severity=${input.testSeverity}, flagged: ${flaggedReasons}`
        : `Test "${input.testSlug}": severity=${input.testSeverity}`;
      return {
        type: "acute_crisis",
        severity: "medium",
        source: "test_session",
        summary,
        metadata: {
          testSessionId: input.testSessionId,
          testSlug: input.testSlug,
          testSeverity: input.testSeverity,
          flaggedItems: input.flaggedItems,
        },
      };
    }
  }
}

export function createCrisisSignalsModule(deps: CrisisSignalsModuleDeps) {
  return {
    async report(input: CrisisSignalInput): Promise<PersistedCrisisSignal> {
      const normalized = normalize(input);
      const signal: PersistedCrisisSignal = {
        id: deps.newId(),
        studentId: input.userId,
        ...normalized,
        createdAt: deps.now(),
      };
      await deps.saveSignal(signal);

      const psychologistIds = await deps.findPsychologistIdsForStudent(input.userId);
      if (psychologistIds.length === 0) {
        deps.logger.warn(
          "Crisis signal created but student has no linked psychologist",
          { studentId: input.userId, signalId: signal.id, source: signal.source },
        );
      }

      return signal;
    },

    async feedFor(
      psychologistId: string,
      filter: FeedFilter,
    ): Promise<CrisisSignalRow[]> {
      if (filter.feed === "red") {
        const rows = await deps.findActiveByPsychologistAndType(
          psychologistId,
          "acute_crisis",
        );
        return rows
          .slice()
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const rows = await deps.findActiveByPsychologistAndType(
        psychologistId,
        "concern",
      );
      return rows.slice().sort((a, b) => {
        const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        if (sev !== 0) return sev;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    },

    async resolve(
      psychologistId: string,
      signalId: string,
      body: ResolveBody,
    ): Promise<CrisisSignalRow> {
      const existing = await deps.findById(signalId, psychologistId);
      if (!existing) {
        throw new NotFoundError("Crisis signal not found");
      }
      if (existing.resolvedAt !== null) {
        throw new ValidationError("Crisis signal is already resolved");
      }
      return deps.resolveSignal(signalId, {
        resolvedAt: deps.now(),
        resolvedBy: psychologistId,
        notes: body.notes ?? null,
        contactedStudent: body.contactedStudent ?? false,
        contactedParent: body.contactedParent ?? false,
        documented: body.documented ?? false,
      });
    },

    async history(psychologistId: string): Promise<CrisisSignalRow[]> {
      const rows = await deps.findHistoryByPsychologist(psychologistId);
      return rows
        .slice()
        .sort(
          (a, b) =>
            (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0),
        );
    },
  };
}

