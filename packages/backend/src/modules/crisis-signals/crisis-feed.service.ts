import { NotFoundError, ValidationError } from "../../shared/errors.js";
import type {
  CrisisSignalSeverity,
  CrisisSignalSource,
  CrisisSignalType,
} from "./crisis-signal-router.js";

export type PersistedSignalRow = {
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

export type CrisisFeedDeps = {
  findByPsychologistAndType: (
    psychologistId: string,
    type: CrisisSignalType,
    options: { onlyActive: boolean },
  ) => Promise<PersistedSignalRow[]>;
  findHistoryByPsychologist: (
    psychologistId: string,
  ) => Promise<PersistedSignalRow[]>;
  findById: (id: string) => Promise<PersistedSignalRow | null>;
  resolveSignal: (id: string, input: ResolveInput) => Promise<PersistedSignalRow>;
  now: () => Date;
};

export type ResolveBody = {
  notes?: string | null;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
};

const SEVERITY_RANK: Record<CrisisSignalSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function createCrisisFeedService(deps: CrisisFeedDeps) {
  return {
    async getRedFeed(psychologistId: string): Promise<PersistedSignalRow[]> {
      const rows = await deps.findByPsychologistAndType(
        psychologistId,
        "acute_crisis",
        { onlyActive: true },
      );
      return rows.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },

    async getYellowFeed(psychologistId: string): Promise<PersistedSignalRow[]> {
      const rows = await deps.findByPsychologistAndType(
        psychologistId,
        "concern",
        { onlyActive: true },
      );
      return rows.sort((a, b) => {
        const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        if (sev !== 0) return sev;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    },

    async getHistory(psychologistId: string): Promise<PersistedSignalRow[]> {
      const rows = await deps.findHistoryByPsychologist(psychologistId);
      return rows.sort(
        (a, b) =>
          (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0),
      );
    },

    async resolve(
      psychologistId: string,
      signalId: string,
      body: ResolveBody,
    ): Promise<PersistedSignalRow> {
      const existing = await deps.findById(signalId);
      if (!existing || !existing.linkedPsychologistIds.includes(psychologistId)) {
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
  };
}
