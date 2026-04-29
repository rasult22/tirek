import { test } from "node:test";
import assert from "node:assert/strict";

import { createPushSender } from "./push-sender.js";
import type { ExpoLike, PushMessage, PushTicket } from "./push-sender.js";

function makeExpo(opts: {
  tickets?: PushTicket[];
  isValid?: (token: string) => boolean;
  onSend?: (chunks: PushMessage[][]) => void;
} = {}): ExpoLike {
  const isValid = opts.isValid ?? ((t: string) => t.startsWith("ExpoPushToken["));
  return {
    isExpoPushToken: isValid,
    chunkPushNotifications: (messages) => {
      // упрощённый chunker: 100 за раз
      const chunks: PushMessage[][] = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }
      return chunks;
    },
    sendPushNotificationsAsync: async (chunk) => {
      opts.onSend?.([chunk]);
      // По умолчанию: каждый сообщению — ok ticket с фейковым id.
      return chunk.map(
        (m, i) =>
          opts.tickets?.[i] ?? {
            status: "ok" as const,
            id: `tkt-${m.to}-${i}`,
          },
      );
    },
  };
}

test("send: пустой массив → возвращает {invalidTokens: []}, SDK не вызывается", async () => {
  let sendCalled = false;
  const expo = makeExpo({
    onSend: () => {
      sendCalled = true;
    },
  });
  const sender = createPushSender({ expo });

  const result = await sender.send([]);

  assert.deepEqual(result, { invalidTokens: [] });
  assert.equal(sendCalled, false);
});

test("send: невалидный token → пропускается, попадает в invalidTokens", async () => {
  const expo = makeExpo();
  const sender = createPushSender({ expo });

  const result = await sender.send([
    { to: "not-an-expo-token", title: "x", body: "y" },
    { to: "ExpoPushToken[abc]", title: "x", body: "y" },
  ]);

  assert.deepEqual(result.invalidTokens, ["not-an-expo-token"]);
});

test("send: ticket со status=error и details.error=DeviceNotRegistered → token в invalidTokens", async () => {
  const expo = makeExpo({
    tickets: [
      {
        status: "error",
        message: "device not registered",
        details: { error: "DeviceNotRegistered" },
      },
    ],
  });
  const sender = createPushSender({ expo });

  const result = await sender.send([
    { to: "ExpoPushToken[dead]", title: "x", body: "y" },
  ]);

  assert.deepEqual(result.invalidTokens, ["ExpoPushToken[dead]"]);
});

test("send: ticket со status=error без DeviceNotRegistered → token НЕ в invalidTokens", async () => {
  const expo = makeExpo({
    tickets: [
      {
        status: "error",
        message: "rate limited",
        details: { error: "MessageRateExceeded" },
      },
    ],
  });
  const sender = createPushSender({ expo });

  const result = await sender.send([
    { to: "ExpoPushToken[abc]", title: "x", body: "y" },
  ]);

  assert.deepEqual(result.invalidTokens, []);
});

test("send: батчует через chunkPushNotifications и шлёт каждый чанк", async () => {
  const sentChunks: PushMessage[][][] = [];
  const expo = makeExpo({
    onSend: (chunks) => sentChunks.push(chunks),
  });
  const sender = createPushSender({ expo });

  // 250 валидных токенов → 3 чанка по 100/100/50
  const messages: PushMessage[] = Array.from({ length: 250 }, (_, i) => ({
    to: `ExpoPushToken[t${i}]`,
    title: "x",
    body: "y",
  }));

  await sender.send(messages);

  // 3 чанка sendPushNotificationsAsync вызова
  assert.equal(sentChunks.length, 3);
  assert.equal(sentChunks[0]![0]!.length, 100);
  assert.equal(sentChunks[1]![0]!.length, 100);
  assert.equal(sentChunks[2]![0]!.length, 50);
});

test("send: при ошибке отправки чанка → НЕ падает, продолжает другие чанки, логирует", async () => {
  const warnings: string[] = [];
  let call = 0;
  const expo: ExpoLike = {
    isExpoPushToken: (t) => t.startsWith("ExpoPushToken["),
    chunkPushNotifications: (m) => [m.slice(0, 1), m.slice(1)],
    sendPushNotificationsAsync: async (chunk) => {
      call++;
      if (call === 1) throw new Error("network error");
      return chunk.map((m, i) => ({ status: "ok" as const, id: `tkt-${i}` }));
    },
  };
  const sender = createPushSender({
    expo,
    logger: { warn: (m) => warnings.push(m) },
  });

  const result = await sender.send([
    { to: "ExpoPushToken[a]", title: "x", body: "y" },
    { to: "ExpoPushToken[b]", title: "x", body: "y" },
  ]);

  assert.deepEqual(result.invalidTokens, []);
  assert.ok(warnings.some((w) => /network error|chunk/i.test(w)));
});
