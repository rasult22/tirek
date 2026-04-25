export type CrisisSignalType = 'acute_crisis' | 'concern';
export type CrisisSignalSeverity = 'high' | 'medium' | 'low';
export type CrisisSignalSource = 'sos_urgent' | 'ai_friend' | 'diagnostics';

export type NotificationType = 'crisis_red' | 'concern_yellow';
export type Feed = 'red' | 'yellow';

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

export type PersistedNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
};

export type CrisisSignalRouterDeps = {
  saveSignal: (signal: PersistedCrisisSignal) => Promise<string>;
  findPsychologistIdsForStudent: (studentId: string) => Promise<string[]>;
  createNotification: (notification: PersistedNotification) => Promise<string>;
  logger: { warn: (msg: string, ctx?: Record<string, unknown>) => void };
  now: () => Date;
  newId: () => string;
};

export type CrisisSignalRouterInput = {
  type: CrisisSignalType;
  severity: CrisisSignalSeverity;
  studentId: string;
  summary: string;
  source: CrisisSignalSource;
  metadata?: Record<string, unknown>;
};

export type CrisisSignalRouterResult = {
  signalId: string;
  feed: Feed;
  notificationIds: string[];
};

export function createCrisisSignalRouter(deps: CrisisSignalRouterDeps) {
  return {
    async route(input: CrisisSignalRouterInput): Promise<CrisisSignalRouterResult> {
      const signalId = deps.newId();
      await deps.saveSignal({
        id: signalId,
        studentId: input.studentId,
        type: input.type,
        severity: input.severity,
        source: input.source,
        summary: input.summary,
        metadata: input.metadata ?? null,
        createdAt: deps.now(),
      });

      const isAcute = input.type === 'acute_crisis';
      const feed: Feed = isAcute ? 'red' : 'yellow';
      const notificationType: NotificationType = isAcute ? 'crisis_red' : 'concern_yellow';
      const title = isAcute ? 'Кризисный сигнал' : 'Требуется внимание';

      const psychologistIds = await deps.findPsychologistIdsForStudent(input.studentId);
      if (psychologistIds.length === 0) {
        deps.logger.warn('Crisis signal created but student has no linked psychologist', {
          studentId: input.studentId,
          signalId,
          type: input.type,
          source: input.source,
        });
      }
      const notificationIds: string[] = [];
      for (const psychologistId of psychologistIds) {
        const notificationId = deps.newId();
        await deps.createNotification({
          id: notificationId,
          userId: psychologistId,
          type: notificationType,
          title,
          body: input.summary,
          metadata: input.metadata ?? null,
        });
        notificationIds.push(notificationId);
      }

      return { signalId, feed, notificationIds };
    },
  };
}
