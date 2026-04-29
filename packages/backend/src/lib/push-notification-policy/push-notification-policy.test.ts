import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluatePushPolicy } from './push-notification-policy.js';

test('crisis_signal_red в полночь субботы → push 24/7', () => {
  // Суббота 00:00 Almaty = пятница 19:00 UTC
  const currentTime = new Date('2026-04-24T19:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_red',
    currentTime,
    recipientOfficeHours: [],
  });

  assert.equal(result.shouldPush, true);
  assert.match(result.reason, /red.*24\/7/i);
});

test('crisis_signal_yellow в субботу (выходной, intervals=[]) → no push', () => {
  // Суббота 14:00 Almaty = 09:00 UTC
  const currentTime = new Date('2026-04-25T09:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [],
  });

  assert.equal(result.shouldPush, false);
  assert.match(result.reason, /yellow.*outside.*office hours/i);
});

test('crisis_signal_yellow в понедельник 10:00 при OH 09:00–17:00 → push', () => {
  // Понедельник 10:00 Almaty = 05:00 UTC
  const currentTime = new Date('2026-04-27T05:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [{ start: '09:00', end: '17:00' }],
  });

  assert.equal(result.shouldPush, true);
  assert.match(result.reason, /yellow.*inside.*office hours/i);
});

test('message_from_crisis_student в полночь субботы → push 24/7', () => {
  // Суббота 00:00 Almaty = пятница 19:00 UTC
  const currentTime = new Date('2026-04-24T19:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'message_from_crisis_student',
    currentTime,
    recipientOfficeHours: [],
  });

  assert.equal(result.shouldPush, true);
  assert.match(result.reason, /crisis student.*24\/7/i);
});

test('message_from_normal_student в субботу → no push', () => {
  const currentTime = new Date('2026-04-25T09:00:00.000Z'); // Сб 14:00 Almaty
  const result = evaluatePushPolicy({
    kind: 'message_from_normal_student',
    currentTime,
    recipientOfficeHours: [],
  });

  assert.equal(result.shouldPush, false);
  assert.match(result.reason, /normal.*outside.*office hours/i);
});

test('message_from_normal_student в офис-часы → push', () => {
  const currentTime = new Date('2026-04-27T05:00:00.000Z'); // Пн 10:00 Almaty
  const result = evaluatePushPolicy({
    kind: 'message_from_normal_student',
    currentTime,
    recipientOfficeHours: [{ start: '09:00', end: '17:00' }],
  });

  assert.equal(result.shouldPush, true);
  assert.match(result.reason, /normal.*inside.*office hours/i);
});

test('message_from_psychologist в любое время → push (для ученика OH не применяются)', () => {
  // Ночь воскресенья 03:00 Almaty
  const currentTime = new Date('2026-04-25T22:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'message_from_psychologist',
    currentTime,
    recipientOfficeHours: [],
  });

  assert.equal(result.shouldPush, true);
  assert.match(result.reason, /from psychologist/i);
});

test('yellow ровно в start интервала (09:00 при OH 09:00-17:00) → push', () => {
  // 09:00 Almaty = 04:00 UTC, понедельник
  const currentTime = new Date('2026-04-27T04:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [{ start: '09:00', end: '17:00' }],
  });

  assert.equal(result.shouldPush, true);
});

test('yellow ровно в end интервала (17:00 при OH 09:00-17:00) → no push', () => {
  // 17:00 Almaty = 12:00 UTC, понедельник
  const currentTime = new Date('2026-04-27T12:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [{ start: '09:00', end: '17:00' }],
  });

  assert.equal(result.shouldPush, false);
});

test('yellow между двумя интервалами (12:00 при OH 09:00-11:00 + 14:00-17:00) → no push', () => {
  // 12:00 Almaty = 07:00 UTC, понедельник
  const currentTime = new Date('2026-04-27T07:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [
      { start: '09:00', end: '11:00' },
      { start: '14:00', end: '17:00' },
    ],
  });

  assert.equal(result.shouldPush, false);
});

test('yellow внутри второго интервала (15:00 при OH 09-11 + 14-17) → push', () => {
  // 15:00 Almaty = 10:00 UTC, понедельник
  const currentTime = new Date('2026-04-27T10:00:00.000Z');
  const result = evaluatePushPolicy({
    kind: 'crisis_signal_yellow',
    currentTime,
    recipientOfficeHours: [
      { start: '09:00', end: '11:00' },
      { start: '14:00', end: '17:00' },
    ],
  });

  assert.equal(result.shouldPush, true);
});
