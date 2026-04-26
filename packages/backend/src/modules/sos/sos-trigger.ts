import { ValidationError } from '../../shared/errors.js';

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
  reportUrgentHelp: (userId: string, sosEventId: string) => Promise<void>;
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
        await deps.reportUrgentHelp(userId, event.id);
      }
      return event;
    },
  };
}
