import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolve } from './resolver.js';

test('R1: template без override → возвращается template, source=template', () => {
  // 2026-04-27 — понедельник (ISO dayOfWeek = 1)
  const result = resolve({
    template: [
      {
        dayOfWeek: 1,
        intervals: [{ start: '09:00', end: '17:00' }],
        notes: 'в кабинете',
      },
    ],
    overrides: [],
    date: '2026-04-27',
  });

  assert.deepEqual(result, {
    intervals: [{ start: '09:00', end: '17:00' }],
    notes: 'в кабинете',
    source: 'template',
  });
});

test('R6: dayOfWeek для date вычисляется в Asia/Almaty (UTC+5)', () => {
  // 2026-04-27 — понедельник в Asia/Almaty (ISO=1).
  // Если ошибочно считать через UTC от полуночи, можно получить вс (7) у некоторых дат —
  // здесь даём template только на 1 (пн); если резолвер посчитает не 1, попадёт в "none".
  const result = resolve({
    template: [
      { dayOfWeek: 1, intervals: [{ start: '10:00', end: '12:00' }], notes: 'пн в Almaty' },
    ],
    overrides: [],
    date: '2026-04-27',
  });

  assert.equal(result.source, 'template');
  assert.deepEqual(result.intervals, [{ start: '10:00', end: '12:00' }]);

  // И ещё одна проверка — другой день недели.
  // 2026-05-03 — воскресенье (ISO=7).
  const sunday = resolve({
    template: [
      { dayOfWeek: 7, intervals: [{ start: '11:00', end: '13:00' }], notes: 'вс' },
    ],
    overrides: [],
    date: '2026-05-03',
  });
  assert.equal(sunday.source, 'template');
  assert.deepEqual(sunday.intervals, [{ start: '11:00', end: '13:00' }]);
});

test('R5: несколько overrides — выбирается ровно тот, что совпадает с date', () => {
  const result = resolve({
    template: [],
    overrides: [
      { date: '2026-04-26', intervals: [{ start: '08:00', end: '09:00' }], notes: 'a' },
      { date: '2026-04-27', intervals: [{ start: '14:00', end: '16:00' }], notes: 'b' },
      { date: '2026-04-28', intervals: [{ start: '20:00', end: '22:00' }], notes: 'c' },
    ],
    date: '2026-04-27',
  });

  assert.deepEqual(result, {
    intervals: [{ start: '14:00', end: '16:00' }],
    notes: 'b',
    source: 'override',
  });
});

test('R4: нет template на dayOfWeek и нет override → пустые intervals, source=none', () => {
  const result = resolve({
    // Шаблон только на пн (1), а дата — вс (7).
    template: [
      {
        dayOfWeek: 1,
        intervals: [{ start: '09:00', end: '17:00' }],
        notes: null,
      },
    ],
    overrides: [],
    date: '2026-05-03', // вс
  });

  assert.deepEqual(result, {
    intervals: [],
    notes: null,
    source: 'none',
  });
});

test('R3: override-выходной (intervals=[]) перекрывает template, source=override', () => {
  const result = resolve({
    template: [
      {
        dayOfWeek: 1,
        intervals: [{ start: '09:00', end: '17:00' }],
        notes: null,
      },
    ],
    overrides: [
      {
        date: '2026-04-27',
        intervals: [],
        notes: 'болею',
      },
    ],
    date: '2026-04-27',
  });

  assert.deepEqual(result, {
    intervals: [],
    notes: 'болею',
    source: 'override',
  });
});

test('R2: override на дату перекрывает template, source=override', () => {
  const result = resolve({
    template: [
      {
        dayOfWeek: 1,
        intervals: [{ start: '09:00', end: '17:00' }],
        notes: 'обычный пн',
      },
    ],
    overrides: [
      {
        date: '2026-04-27',
        intervals: [{ start: '14:00', end: '16:00' }],
        notes: 'короткий день',
      },
    ],
    date: '2026-04-27',
  });

  assert.deepEqual(result, {
    intervals: [{ start: '14:00', end: '16:00' }],
    notes: 'короткий день',
    source: 'override',
  });
});
