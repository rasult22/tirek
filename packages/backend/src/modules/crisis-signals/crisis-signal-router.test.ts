import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCrisisSignalRouter } from './crisis-signal-router.js';
import type {
  CrisisSignalRouterDeps,
  PersistedCrisisSignal,
  PersistedNotification,
} from './crisis-signal-router.js';

type Fakes = {
  signals: PersistedCrisisSignal[];
  notifications: PersistedNotification[];
  warnings: Array<{ msg: string; ctx?: Record<string, unknown> }>;
  callOrder: string[];
};

function makeRouter(overrides: Partial<CrisisSignalRouterDeps> = {}) {
  const fakes: Fakes = {
    signals: [],
    notifications: [],
    warnings: [],
    callOrder: [],
  };
  let idCounter = 0;
  const deps: CrisisSignalRouterDeps = {
    saveSignal: async (signal) => {
      fakes.callOrder.push(`saveSignal:${signal.id}`);
      fakes.signals.push(signal);
      return signal.id;
    },
    findPsychologistIdsForStudent: async () => ['psy-1'],
    createNotification: async (notification) => {
      fakes.callOrder.push(`createNotification:${notification.id}`);
      fakes.notifications.push(notification);
      return notification.id;
    },
    logger: {
      warn: (msg, ctx) => {
        fakes.warnings.push({ msg, ctx });
      },
    },
    now: () => new Date('2026-04-25T10:00:00.000Z'),
    newId: () => `id-${++idCounter}`,
    ...overrides,
  };
  return { router: createCrisisSignalRouter(deps), fakes };
}

test('should_route_acute_crisis_to_red_feed_with_crisis_red_notification', async () => {
  const { router, fakes } = makeRouter();

  const result = await router.route({
    type: 'acute_crisis',
    severity: 'high',
    studentId: 'stu-1',
    summary: 'Student expressed suicidal ideation in AI-Friend chat',
    source: 'ai_friend',
  });

  assert.equal(result.feed, 'red');
  assert.equal(fakes.notifications.length, 1);
  assert.equal(fakes.notifications[0].type, 'crisis_red');
  assert.equal(fakes.notifications[0].userId, 'psy-1');
  assert.deepEqual(result.notificationIds, [fakes.notifications[0].id]);
  assert.equal(fakes.signals.length, 1);
  assert.equal(result.signalId, fakes.signals[0].id);
});

test('should_route_concern_to_yellow_feed_with_concern_yellow_notification', async () => {
  const { router, fakes } = makeRouter();

  const result = await router.route({
    type: 'concern',
    severity: 'medium',
    studentId: 'stu-1',
    summary: 'Possible bullying — recurring tension with classmates',
    source: 'ai_friend',
  });

  assert.equal(result.feed, 'yellow');
  assert.equal(fakes.notifications.length, 1);
  assert.equal(fakes.notifications[0].type, 'concern_yellow');
});

const typeSeverityMatrix: Array<{
  type: 'acute_crisis' | 'concern';
  severity: 'high' | 'medium' | 'low';
  expectedFeed: 'red' | 'yellow';
}> = [
  { type: 'acute_crisis', severity: 'high', expectedFeed: 'red' },
  { type: 'acute_crisis', severity: 'medium', expectedFeed: 'red' },
  { type: 'acute_crisis', severity: 'low', expectedFeed: 'red' },
  { type: 'concern', severity: 'high', expectedFeed: 'yellow' },
  { type: 'concern', severity: 'medium', expectedFeed: 'yellow' },
  { type: 'concern', severity: 'low', expectedFeed: 'yellow' },
];

for (const { type, severity, expectedFeed } of typeSeverityMatrix) {
  test(`should_persist_severity_${severity}_on_signal_and_route_${type}_to_${expectedFeed}_regardless_of_severity`, async () => {
    const { router, fakes } = makeRouter();

    const result = await router.route({
      type,
      severity,
      studentId: 'stu-1',
      summary: 's',
      source: 'ai_friend',
    });

    assert.equal(result.feed, expectedFeed);
    assert.equal(fakes.signals[0].severity, severity);
    assert.equal(fakes.signals[0].type, type);
  });
}

const sources: Array<'sos_urgent' | 'ai_friend' | 'diagnostics'> = [
  'sos_urgent',
  'ai_friend',
  'diagnostics',
];

for (const source of sources) {
  test(`should_persist_source_${source}_on_signal`, async () => {
    const { router, fakes } = makeRouter();

    await router.route({
      type: 'acute_crisis',
      severity: 'high',
      studentId: 'stu-1',
      summary: 's',
      source,
    });

    assert.equal(fakes.signals[0].source, source);
  });
}

test('should_save_signal_before_creating_any_notifications', async () => {
  const { router, fakes } = makeRouter({
    findPsychologistIdsForStudent: async () => ['psy-A', 'psy-B'],
  });

  await router.route({
    type: 'acute_crisis',
    severity: 'high',
    studentId: 'stu-1',
    summary: 's',
    source: 'sos_urgent',
  });

  const firstSaveSignal = fakes.callOrder.findIndex((c) => c.startsWith('saveSignal:'));
  const firstCreateNotification = fakes.callOrder.findIndex((c) =>
    c.startsWith('createNotification:'),
  );
  assert.notEqual(firstSaveSignal, -1);
  assert.notEqual(firstCreateNotification, -1);
  assert.ok(
    firstSaveSignal < firstCreateNotification,
    `signal must be persisted before any notification (got order ${fakes.callOrder.join(', ')})`,
  );
});

test('should_persist_provided_metadata_verbatim_on_signal_and_notification', async () => {
  const { router, fakes } = makeRouter();
  const metadata = { aiSessionId: 'sess-42', triggerKeywords: ['боль', 'устал'] };

  await router.route({
    type: 'concern',
    severity: 'medium',
    studentId: 'stu-1',
    summary: 's',
    source: 'ai_friend',
    metadata,
  });

  assert.deepEqual(fakes.signals[0].metadata, metadata);
  assert.deepEqual(fakes.notifications[0].metadata, metadata);
});

test('should_store_metadata_as_null_when_not_provided', async () => {
  const { router, fakes } = makeRouter();

  await router.route({
    type: 'concern',
    severity: 'low',
    studentId: 'stu-1',
    summary: 's',
    source: 'ai_friend',
  });

  assert.equal(fakes.signals[0].metadata, null);
  assert.equal(fakes.notifications[0].metadata, null);
});

test('should_save_signal_warn_and_return_empty_notifications_when_student_has_no_linked_psychologist', async () => {
  const { router, fakes } = makeRouter({
    findPsychologistIdsForStudent: async () => [],
  });

  const result = await router.route({
    type: 'acute_crisis',
    severity: 'high',
    studentId: 'orphan-stu',
    summary: 's',
    source: 'sos_urgent',
  });

  assert.equal(fakes.signals.length, 1);
  assert.equal(fakes.notifications.length, 0);
  assert.deepEqual(result.notificationIds, []);
  assert.equal(result.feed, 'red');
  assert.equal(fakes.warnings.length, 1);
  assert.equal(fakes.warnings[0].ctx?.studentId, 'orphan-stu');
  assert.equal(fakes.warnings[0].ctx?.signalId, result.signalId);
});

test('should_create_one_signal_and_one_notification_per_linked_psychologist', async () => {
  const { router, fakes } = makeRouter({
    findPsychologistIdsForStudent: async () => ['psy-A', 'psy-B'],
  });

  const result = await router.route({
    type: 'concern',
    severity: 'low',
    studentId: 'stu-1',
    summary: 's',
    source: 'ai_friend',
  });

  assert.equal(fakes.signals.length, 1);
  assert.equal(fakes.notifications.length, 2);
  assert.equal(result.notificationIds.length, 2);
  const recipients = fakes.notifications.map((n) => n.userId).sort();
  assert.deepEqual(recipients, ['psy-A', 'psy-B']);
  // notificationIds in result match the actually-created ones
  assert.deepEqual(
    result.notificationIds.slice().sort(),
    fakes.notifications.map((n) => n.id).sort(),
  );
});
