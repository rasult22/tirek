import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ValidationError } from '../../shared/errors.js';
import { createSosTriggerService } from './sos-trigger.js';
import type {
  SosTriggerDeps,
  PersistedSosEvent,
} from './sos-trigger.js';
import type { CrisisSignalRouterInput, CrisisSignalRouterResult } from '../crisis-signals/crisis-signal-router.js';

type RouterCall = CrisisSignalRouterInput;

type Fakes = {
  saved: PersistedSosEvent[];
  routerCalls: RouterCall[];
};

function makeService(overrides: Partial<SosTriggerDeps> = {}) {
  const fakes: Fakes = { saved: [], routerCalls: [] };
  let idCounter = 0;
  const deps: SosTriggerDeps = {
    saveEvent: async (event) => {
      fakes.saved.push(event);
      return event;
    },
    routeCrisisSignal: async (input) => {
      fakes.routerCalls.push(input);
      const result: CrisisSignalRouterResult = {
        signalId: 'sig-1',
        feed: 'red',
        notificationIds: ['n-1'],
      };
      return result;
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
  test(`should_save_event_with_type_${action}_and_NOT_route_crisis_signal`, async () => {
    const { service, fakes } = makeService();

    await service.trigger('stu-1', { action });

    assert.equal(fakes.saved.length, 1);
    assert.equal(fakes.saved[0].type, action);
    assert.equal(fakes.routerCalls.length, 0, 'crisis signal must not be routed for non-urgent actions');
  });
}

test('should_route_crisis_signal_once_with_acute_high_sos_urgent_when_action_is_urgent', async () => {
  const { service, fakes } = makeService();

  await service.trigger('stu-1', { action: 'urgent' });

  assert.equal(fakes.routerCalls.length, 1);
  const call = fakes.routerCalls[0];
  assert.equal(call.type, 'acute_crisis');
  assert.equal(call.severity, 'high');
  assert.equal(call.source, 'sos_urgent');
  assert.equal(call.studentId, 'stu-1');
  assert.equal(typeof call.summary, 'string');
  assert.ok(call.summary.length > 0, 'summary must be non-empty');
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
  assert.equal(fakes.routerCalls.length, 0);
});
