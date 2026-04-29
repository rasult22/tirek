import { test } from "node:test";
import assert from "node:assert/strict";

import { createPushDispatcher } from "./push-dispatcher.js";
import type {
  PushDispatcherDeps,
  DispatchEvent,
} from "./push-dispatcher.js";
import type { PushMessage } from "../../lib/push-sender/push-sender.js";
import type { PushTokenRecord } from "../push-tokens/push-tokens.factory.js";

type Spy = {
  resolveCalls: { psychologistId: string; date: string }[];
  sentMessages: PushMessage[];
  removedTokens: string[];
};

function makeDispatcher(opts: {
  tokensByUser?: Record<string, PushTokenRecord[]>;
  officeHoursByPsy?: Record<string, { start: string; end: string }[]>;
  invalidOnSend?: string[];
}) {
  const spy: Spy = { resolveCalls: [], sentMessages: [], removedTokens: [] };

  const deps: PushDispatcherDeps = {
    getTokensForUser: async (userId) => opts.tokensByUser?.[userId] ?? [],
    resolveOfficeHoursForDate: async (psychologistId, date) => {
      spy.resolveCalls.push({ psychologistId, date });
      return {
        intervals: opts.officeHoursByPsy?.[psychologistId] ?? [],
        notes: null,
        source: "template",
      };
    },
    sendPush: async (messages) => {
      spy.sentMessages.push(...messages);
      return { invalidTokens: opts.invalidOnSend ?? [] };
    },
    removeToken: async (token) => {
      spy.removedTokens.push(token);
    },
    almatyDayFor: () => "2026-04-25",
    logger: { warn: () => {}, info: () => {} },
  };

  return { dispatcher: createPushDispatcher(deps), spy };
}

const ALMATY_SAT_MIDNIGHT = new Date("2026-04-24T19:00:00.000Z"); // Сб 00:00 Almaty
const ALMATY_MON_10 = new Date("2026-04-27T05:00:00.000Z"); // Пн 10:00 Almaty

test("crisis_signal_red в полночь субботы → push к психологу даже без OH", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[psy]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
    officeHoursByPsy: {}, // нет OH вообще
  });

  const event: DispatchEvent = {
    kind: "crisis_signal_red",
    recipientUserId: "psy-1",
    title: "🚨 Критический сигнал",
    body: "Иван, 9А — нажал SOS",
    data: { type: "crisis_alert", signalId: "sig-1" },
    currentTime: ALMATY_SAT_MIDNIGHT,
  };

  await dispatcher.dispatch(event);

  assert.equal(spy.sentMessages.length, 1);
  assert.equal(spy.sentMessages[0]!.to, "ExpoPushToken[psy]");
  assert.equal(spy.sentMessages[0]!.title, "🚨 Критический сигнал");
});

test("crisis_signal_yellow в субботу (выходной) → push НЕ отправляется", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[psy]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
    officeHoursByPsy: { "psy-1": [] }, // суббота выходной
  });

  await dispatcher.dispatch({
    kind: "crisis_signal_yellow",
    recipientUserId: "psy-1",
    title: "x",
    body: "y",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.equal(spy.sentMessages.length, 0);
});

test("crisis_signal_yellow в понедельник 10:00 при OH 09-17 → push отправляется", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[psy]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
    officeHoursByPsy: { "psy-1": [{ start: "09:00", end: "17:00" }] },
  });

  await dispatcher.dispatch({
    kind: "crisis_signal_yellow",
    recipientUserId: "psy-1",
    title: "x",
    body: "y",
    currentTime: ALMATY_MON_10,
  });

  assert.equal(spy.sentMessages.length, 1);
});

test("message_from_psychologist в любое время → push ученику без OH-проверки", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "stu-1": [
        {
          token: "ExpoPushToken[stu]",
          userId: "stu-1",
          platform: "android",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
  });

  await dispatcher.dispatch({
    kind: "message_from_psychologist",
    recipientUserId: "stu-1",
    title: "Психолог",
    body: "Привет",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.equal(spy.sentMessages.length, 1);
  // Для ученика office hours не резолвятся
  assert.equal(spy.resolveCalls.length, 0);
});

test("message_from_crisis_student в полночь субботы → push 24/7 психологу", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[psy]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
    officeHoursByPsy: { "psy-1": [] },
  });

  await dispatcher.dispatch({
    kind: "message_from_crisis_student",
    recipientUserId: "psy-1",
    title: "Сообщение",
    body: "от crisis-ученика",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.equal(spy.sentMessages.length, 1);
});

test("dispatch: множественные токены одного юзера → одно событие = N сообщений", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[ios]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
        {
          token: "ExpoPushToken[android]",
          userId: "psy-1",
          platform: "android",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
  });

  await dispatcher.dispatch({
    kind: "crisis_signal_red",
    recipientUserId: "psy-1",
    title: "x",
    body: "y",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.equal(spy.sentMessages.length, 2);
  assert.deepEqual(
    spy.sentMessages.map((m) => m.to).sort(),
    ["ExpoPushToken[android]", "ExpoPushToken[ios]"],
  );
});

test("dispatch: invalid token из sender → удаляется из БД", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {
      "psy-1": [
        {
          token: "ExpoPushToken[dead]",
          userId: "psy-1",
          platform: "ios",
          createdAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
    },
    invalidOnSend: ["ExpoPushToken[dead]"],
  });

  await dispatcher.dispatch({
    kind: "crisis_signal_red",
    recipientUserId: "psy-1",
    title: "x",
    body: "y",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.deepEqual(spy.removedTokens, ["ExpoPushToken[dead]"]);
});

test("dispatch: получатель без токенов → НЕ резолвит OH, НЕ шлёт push", async () => {
  const { dispatcher, spy } = makeDispatcher({
    tokensByUser: {}, // токенов нет вообще
  });

  await dispatcher.dispatch({
    kind: "crisis_signal_red",
    recipientUserId: "psy-1",
    title: "x",
    body: "y",
    currentTime: ALMATY_SAT_MIDNIGHT,
  });

  assert.equal(spy.sentMessages.length, 0);
  assert.equal(spy.resolveCalls.length, 0);
});
