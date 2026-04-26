import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ValidationError } from '../../shared/errors.js';
import { createSosTriggerService } from './sos-trigger.js';
import type {
  SosTriggerDeps,
  PersistedSosEvent,
} from './sos-trigger.js';

type UrgentHelpCall = { userId: string; sosEventId: string };

type Fakes = {
  saved: PersistedSosEvent[];
  urgentHelpCalls: UrgentHelpCall[];
};

function makeService(overrides: Partial<SosTriggerDeps> = {}) {
  const fakes: Fakes = { saved: [], urgentHelpCalls: [] };
  let idCounter = 0;
  const deps: SosTriggerDeps = {
    saveEvent: async (event) => {
      fakes.saved.push(event);
      return event;
    },
    reportUrgentHelp: async (userId, sosEventId) => {
      fakes.urgentHelpCalls.push({ userId, sosEventId });
    },
    now: () => new Date('2026-04-25T10:00:00.000Z'),
    newId: () => `evt-${++idCounter}`,
    ...overrides,
  };
  return { service: createSosTriggerService(deps), fakes };
}

test('should_save_sos_event_with_type_urgent_when_action_is_urgent', async () => {
  const { service, fakes } = makeService();

  await service.trigger('stu-1', { action: 'urgent' });

  assert.equal(fakes.saved.length, 1);
  assert.equal(fakes.saved[0].type, 'urgent');
  assert.equal(fakes.saved[0].userId, 'stu-1');
  assert.equal(fakes.saved[0].id, 'evt-1');
  assert.deepEqual(fakes.saved[0].createdAt, new Date('2026-04-25T10:00:00.000Z'));
});

for (const action of ['breathing', 'hotline', 'chat'] as const) {
  test(`should_save_event_with_type_${action}_and_NOT_report_urgent_help`, async () => {
    const { service, fakes } = makeService();

    await service.trigger('stu-1', { action });

    assert.equal(fakes.saved.length, 1);
    assert.equal(fakes.saved[0].type, action);
    assert.equal(fakes.urgentHelpCalls.length, 0, 'urgent_help must not be reported for non-urgent actions');
  });
}

test('should_report_urgent_help_once_with_userId_and_sos_event_id_when_action_is_urgent', async () => {
  const { service, fakes } = makeService();

  await service.trigger('stu-1', { action: 'urgent' });

  assert.equal(fakes.urgentHelpCalls.length, 1);
  assert.equal(fakes.urgentHelpCalls[0].userId, 'stu-1');
  assert.equal(fakes.urgentHelpCalls[0].sosEventId, fakes.saved[0].id);
});

test('should_return_the_persisted_event_for_urgent_action_not_the_router_result', async () => {
  const { service, fakes } = makeService();

  const result = await service.trigger('stu-1', { action: 'urgent' });

  // The route handler returns the SOS event so the client can show its id;
  // crisis-routing is a side effect.
  assert.equal(result.id, 'evt-1');
  assert.equal(result.type, 'urgent');
  assert.equal(result.userId, 'stu-1');
  assert.deepEqual(result, fakes.saved[0]);
});

test('should_throw_validation_error_and_save_nothing_when_action_is_invalid', async () => {
  const { service, fakes } = makeService();

  await assert.rejects(
    () => service.trigger('stu-1', { action: 'panic' as never }),
    (err: unknown) => err instanceof ValidationError,
  );

  assert.equal(fakes.saved.length, 0);
  assert.equal(fakes.urgentHelpCalls.length, 0);
});
