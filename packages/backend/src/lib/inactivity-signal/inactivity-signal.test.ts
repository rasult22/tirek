import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluate } from './inactivity-signal.js';

test('should_return_empty_list_when_no_students_provided', () => {
  const result = evaluate({
    students: [],
    thresholdDays: 3,
    today: '2026-04-26',
  });

  assert.deepEqual(result, []);
});

test('should_include_student_inactive_for_more_days_than_threshold', () => {
  // 5 дней назад при threshold=3 → попадает
  const result = evaluate({
    students: [
      {
        studentId: 's1',
        studentName: 'Айгуль К.',
        grade: 7,
        classLetter: 'А',
        lastActiveDate: '2026-04-21',
      },
    ],
    thresholdDays: 3,
    today: '2026-04-26',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.studentId, 's1');
  assert.equal(result[0]?.daysInactive, 5);
  assert.equal(result[0]?.lastActiveDate, '2026-04-21');
});

test('should_exclude_student_at_or_below_threshold_boundary', () => {
  // Активность 2 дня назад при threshold=3 → НЕ в списке (AC).
  // Активность ровно 3 дня назад тоже НЕ должна попадать — порог "более X дней".
  const result = evaluate({
    students: [
      {
        studentId: 'twoDays',
        studentName: 'Two',
        grade: null,
        classLetter: null,
        lastActiveDate: '2026-04-24',
      },
      {
        studentId: 'threeDays',
        studentName: 'Three',
        grade: null,
        classLetter: null,
        lastActiveDate: '2026-04-23',
      },
    ],
    thresholdDays: 3,
    today: '2026-04-26',
  });

  assert.deepEqual(result, []);
});

test('should_include_student_with_no_activity_ever_and_null_daysInactive', () => {
  const result = evaluate({
    students: [
      {
        studentId: 'never',
        studentName: 'Never Active',
        grade: 8,
        classLetter: 'Б',
        lastActiveDate: null,
      },
    ],
    thresholdDays: 3,
    today: '2026-04-26',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.studentId, 'never');
  assert.equal(result[0]?.daysInactive, null);
  assert.equal(result[0]?.lastActiveDate, null);
});

test('should_sort_by_daysInactive_descending_with_never_active_first', () => {
  // Виджет показывает top N — самые "забытые" должны быть наверху.
  // Без активности (null) приоритетнее всего, дальше — по убыванию daysInactive.
  const result = evaluate({
    students: [
      { studentId: 'a', studentName: 'A', grade: null, classLetter: null, lastActiveDate: '2026-04-21' }, // 5 дней
      { studentId: 'b', studentName: 'B', grade: null, classLetter: null, lastActiveDate: null },         // null
      { studentId: 'c', studentName: 'C', grade: null, classLetter: null, lastActiveDate: '2026-04-15' }, // 11 дней
      { studentId: 'd', studentName: 'D', grade: null, classLetter: null, lastActiveDate: '2026-04-22' }, // 4 дня
    ],
    thresholdDays: 3,
    today: '2026-04-26',
  });

  assert.deepEqual(
    result.map((r) => r.studentId),
    ['b', 'c', 'a', 'd'],
  );
});
