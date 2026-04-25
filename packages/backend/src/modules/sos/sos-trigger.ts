import { ValidationError } from '../../shared/errors.js';
import type {
  CrisisSignalRouterInput,
  CrisisSignalRouterResult,
} from '../crisis-signals/crisis-signal-router.js';

export type SosAction = 'breathing' | 'hotline' | 'chat' | 'urgent';

const SOS_ACTIONS: readonly SosAction[] = ['breathing', 'hotline', 'chat', 'urgent'];

export type PersistedSosEvent = {
  id: string;
  userId: string;
  type: SosAction;
  createdAt: Date;
};

export type SosTriggerDeps = {
  saveEvent: (event: PersistedSosEvent) => Promise<PersistedSosEvent>;
  routeCrisisSignal: (input: CrisisSignalRouterInput) => Promise<CrisisSignalRouterResult>;
  now: () => Date;
  newId: () => string;
};

export function createSosTriggerService(deps: SosTriggerDeps) {
  return {
    async trigger(userId: string, body: { action: SosAction }) {
      if (!SOS_ACTIONS.includes(body.action)) {
        throw new ValidationError(
          `Action must be one of ${SOS_ACTIONS.join(', ')}`,
        );
      }
      const event = await deps.saveEvent({
        id: deps.newId(),
        userId,
        type: body.action,
        createdAt: deps.now(),
      });
      if (body.action === 'urgent') {
        await deps.routeCrisisSignal({
          type: 'acute_crisis',
          severity: 'high',
          source: 'sos_urgent',
          studentId: userId,
          summary: 'Ученик нажал «Мне срочно плохо»',
        });
      }
      return event;
    },
  };
}
