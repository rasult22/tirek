import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createOfficeHoursService } from './office-hours.factory.js';
import type {
  OfficeHoursDeps,
  TemplateRecord,
  OverrideRecord,
} from './office-hours.factory.js';

type Fakes = {
  templates: TemplateRecord[];
  overrides: OverrideRecord[];
};

function makeService(overrides: Partial<OfficeHoursDeps> = {}, seed: Partial<Fakes> = {}) {
  const fakes: Fakes = {
    templates: seed.templates ?? [],
    overrides: seed.overrides ?? [],
  };

  const deps: OfficeHoursDeps = {
    findTemplateByPsychologist: async (psychologistId) =>
      fakes.templates.filter((t) => t.psychologistId === psychologistId),
    upsertTemplateDay: async (data) => {
      const idx = fakes.templates.findIndex(
        (t) => t.psychologistId === data.psychologistId && t.dayOfWeek === data.dayOfWeek,
      );
      const row: TemplateRecord = {
        id: idx >= 0 ? fakes.templates[idx]!.id : `tpl-${fakes.templates.length + 1}`,
        psychologistId: data.psychologistId,
        dayOfWeek: data.dayOfWeek,
        intervals: data.intervals,
        notes: data.notes,
        updatedAt: new Date('2026-04-28T10:00:00.000Z'),
      };
      if (idx >= 0) fakes.templates[idx] = row;
      else fakes.templates.push(row);
      return row;
    },
    findOverridesByRange: async (psychologistId, from, to) =>
      fakes.overrides
        .filter((o) => o.psychologistId === psychologistId && o.date >= from && o.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date)),
    upsertOverrideDay: async (data) => {
      const idx = fakes.overrides.findIndex(
        (o) => o.psychologistId === data.psychologistId && o.date === data.date,
      );
      const row: OverrideRecord = {
        id: idx >= 0 ? fakes.overrides[idx]!.id : `ovr-${fakes.overrides.length + 1}`,
        psychologistId: data.psychologistId,
        date: data.date,
        intervals: data.intervals,
        notes: data.notes,
        updatedAt: new Date('2026-04-28T10:00:00.000Z'),
      };
      if (idx >= 0) fakes.overrides[idx] = row;
      else fakes.overrides.push(row);
      return row;
    },
    deleteOverrideDay: async (psychologistId, date) => {
      const idx = fakes.overrides.findIndex(
        (o) => o.psychologistId === psychologistId && o.date === date,
      );
      if (idx < 0) return false;
      fakes.overrides.splice(idx, 1);
      return true;
    },
    findStudentPsychologistLink: async () => null,
    ...overrides,
  };

  return { service: createOfficeHoursService(deps), fakes };
}

test('T8: resolveForDate — студент к своему психологу проходит, к чужому → 403', async () => {
  const { service } = makeService(
    {
      findStudentPsychologistLink: async (studentId) => {
        if (studentId === 'stu-1') return { studentId, psychologistId: 'psy-1' };
        return null;
      },
    },
    {
      templates: [
        {
          id: 't1',
          psychologistId: 'psy-1',
          dayOfWeek: 1,
          intervals: [{ start: '09:00', end: '17:00' }],
          notes: null,
          updatedAt: new Date(),
        },
      ],
    },
  );

  // Свой — ок.
  const own = await service.resolveForDate('stu-1', 'student', 'psy-1', '2026-04-27');
  assert.equal(own.source, 'template');

  // Чужой психолог — 403.
  await assert.rejects(
    () => service.resolveForDate('stu-1', 'student', 'psy-2', '2026-04-27'),
    /forbidden|linked psychologist/i,
  );

  // Студент без линка — 403.
  await assert.rejects(
    () => service.resolveForDate('stu-orphan', 'student', 'psy-1', '2026-04-27'),
    /forbidden|linked psychologist/i,
  );
});

test('T8b: resolveForDate — психолог к чужому ID → 403', async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.resolveForDate('psy-1', 'psychologist', 'psy-2', '2026-04-27'),
    /own office hours/i,
  );
});

test('T7: resolveForDate психологом для своего ID мержит template+override', async () => {
  const { service } = makeService(
    {},
    {
      templates: [
        {
          id: 't1',
          psychologistId: 'psy-1',
          dayOfWeek: 1,
          intervals: [{ start: '09:00', end: '17:00' }],
          notes: 'обычный пн',
          updatedAt: new Date(),
        },
      ],
      overrides: [
        {
          id: 'o1',
          psychologistId: 'psy-1',
          date: '2026-04-27',
          intervals: [{ start: '14:00', end: '16:00' }],
          notes: 'короткий день',
          updatedAt: new Date(),
        },
      ],
    },
  );

  const result = await service.resolveForDate('psy-1', 'psychologist', 'psy-1', '2026-04-27');

  assert.deepEqual(result, {
    intervals: [{ start: '14:00', end: '16:00' }],
    notes: 'короткий день',
    source: 'override',
  });
});

test('T6: deleteOverrideDay удаляет существующий override', async () => {
  const { service, fakes } = makeService(
    {},
    {
      overrides: [
        {
          id: 'o1',
          psychologistId: 'psy-1',
          date: '2026-04-27',
          intervals: [],
          notes: null,
          updatedAt: new Date(),
        },
      ],
    },
  );

  await service.deleteOverrideDay('psy-1', '2026-04-27');
  assert.equal(fakes.overrides.length, 0);
});

test('T6b: deleteOverrideDay бросает NotFoundError если override отсутствует', async () => {
  const { service } = makeService();

  await assert.rejects(() => service.deleteOverrideDay('psy-1', '2026-04-27'), /not found/i);
});

test('T5: upsertOverrideDay принимает intervals=[] (выходной) и сохраняет notes', async () => {
  const { service, fakes } = makeService();

  const row = await service.upsertOverrideDay('psy-1', '2026-04-27', {
    intervals: [],
    notes: 'болею',
  });

  assert.deepEqual(row.intervals, []);
  assert.equal(row.notes, 'болею');
  assert.equal(row.date, '2026-04-27');
  assert.equal(fakes.overrides.length, 1);
});

test('T5b: upsertOverrideDay бросает ValidationError для невалидной даты', async () => {
  const { service } = makeService();

  await assert.rejects(
    () =>
      service.upsertOverrideDay('psy-1', '27-04-2026', {
        intervals: [],
      }),
    /YYYY-MM-DD/i,
  );
});

test('T4: getOverrides возвращает overrides в диапазоне дат, отсортированные по дате', async () => {
  const { service } = makeService(
    {},
    {
      overrides: [
        {
          id: 'o1',
          psychologistId: 'psy-1',
          date: '2026-04-25',
          intervals: [],
          notes: 'выходной',
          updatedAt: new Date(),
        },
        {
          id: 'o2',
          psychologistId: 'psy-1',
          date: '2026-04-27',
          intervals: [{ start: '14:00', end: '16:00' }],
          notes: null,
          updatedAt: new Date(),
        },
        {
          id: 'o3',
          psychologistId: 'psy-1',
          date: '2026-05-10',
          intervals: [{ start: '10:00', end: '11:00' }],
          notes: null,
          updatedAt: new Date(),
        },
        {
          id: 'o-other',
          psychologistId: 'psy-2',
          date: '2026-04-27',
          intervals: [{ start: '08:00', end: '09:00' }],
          notes: null,
          updatedAt: new Date(),
        },
      ],
    },
  );

  const rows = await service.getOverrides('psy-1', '2026-04-26', '2026-04-30');
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.date, '2026-04-27');
});

test('T4b: getOverrides бросает ValidationError если from > to', async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.getOverrides('psy-1', '2026-04-30', '2026-04-25'),
    /from must be <= to/i,
  );
});

test('T3: upsertTemplateDay бросает ValidationError для dayOfWeek=0 и dayOfWeek=8', async () => {
  const { service } = makeService();

  await assert.rejects(
    () =>
      service.upsertTemplateDay('psy-1', 0, {
        intervals: [{ start: '09:00', end: '10:00' }],
      }),
    /dayOfWeek/i,
  );
  await assert.rejects(
    () =>
      service.upsertTemplateDay('psy-1', 8, {
        intervals: [{ start: '09:00', end: '10:00' }],
      }),
    /dayOfWeek/i,
  );
});

test('T3b: upsertTemplateDay бросает ValidationError для overlapping intervals', async () => {
  const { service } = makeService();

  await assert.rejects(
    () =>
      service.upsertTemplateDay('psy-1', 1, {
        intervals: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '13:00' },
        ],
      }),
    /overlap/i,
  );
});

test('T2: upsertTemplateDay создаёт строку если её нет, и обновляет если есть', async () => {
  const { service, fakes } = makeService();

  const created = await service.upsertTemplateDay('psy-1', 1, {
    intervals: [{ start: '09:00', end: '12:00' }],
    notes: 'утро',
  });
  assert.equal(created.dayOfWeek, 1);
  assert.equal(created.psychologistId, 'psy-1');
  assert.deepEqual(created.intervals, [{ start: '09:00', end: '12:00' }]);
  assert.equal(created.notes, 'утро');
  assert.equal(fakes.templates.length, 1);

  const updated = await service.upsertTemplateDay('psy-1', 1, {
    intervals: [{ start: '10:00', end: '13:00' }],
    notes: null,
  });
  assert.equal(updated.id, created.id, 'тот же id — не дубликат');
  assert.deepEqual(updated.intervals, [{ start: '10:00', end: '13:00' }]);
  assert.equal(updated.notes, null);
  assert.equal(fakes.templates.length, 1, 'количество не выросло');
});

test('T1: getTemplate возвращает все строки шаблона текущего психолога', async () => {
  const { service } = makeService(
    {},
    {
      templates: [
        {
          id: 'tpl-1',
          psychologistId: 'psy-1',
          dayOfWeek: 1,
          intervals: [{ start: '09:00', end: '12:00' }],
          notes: null,
          updatedAt: new Date('2026-04-27T10:00:00.000Z'),
        },
        {
          id: 'tpl-2',
          psychologistId: 'psy-1',
          dayOfWeek: 3,
          intervals: [{ start: '14:00', end: '17:00' }],
          notes: 'среда онлайн',
          updatedAt: new Date('2026-04-27T10:00:00.000Z'),
        },
        {
          id: 'tpl-other',
          psychologistId: 'psy-2',
          dayOfWeek: 1,
          intervals: [{ start: '08:00', end: '09:00' }],
          notes: null,
          updatedAt: new Date('2026-04-27T10:00:00.000Z'),
        },
      ],
    },
  );

  const rows = await service.getTemplate('psy-1');

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.dayOfWeek).sort(),
    [1, 3],
  );
  // Чужие психологи не утекают.
  assert.ok(rows.every((r) => r.psychologistId === 'psy-1'));
});
