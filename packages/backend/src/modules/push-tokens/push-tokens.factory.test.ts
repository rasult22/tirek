import { test } from "node:test";
import assert from "node:assert/strict";

import { createPushTokensService } from "./push-tokens.factory.js";
import type {
  PushTokenRecord,
  PushTokensDeps,
} from "./push-tokens.factory.js";

type Fakes = {
  rows: PushTokenRecord[];
};

function makeService(initial: PushTokenRecord[] = []) {
  const fakes: Fakes = { rows: [...initial] };

  const deps: PushTokensDeps = {
    upsert: async ({ token, userId, platform, now }) => {
      const existing = fakes.rows.find((r) => r.token === token);
      if (existing) {
        existing.userId = userId;
        existing.platform = platform;
        existing.lastSeenAt = now;
        return existing;
      }
      const row: PushTokenRecord = {
        token,
        userId,
        platform,
        createdAt: now,
        lastSeenAt: now,
      };
      fakes.rows.push(row);
      return row;
    },
    findByUserId: async (userId) =>
      fakes.rows.filter((r) => r.userId === userId),
    deleteByToken: async (token) => {
      const idx = fakes.rows.findIndex((r) => r.token === token);
      if (idx >= 0) fakes.rows.splice(idx, 1);
      return idx >= 0;
    },
  };

  return {
    service: createPushTokensService(deps),
    fakes,
  };
}

test("register: новый токен → создаёт запись с userId/platform/timestamps", async () => {
  const { service, fakes } = makeService();
  const before = Date.now();

  await service.register("user-1", { token: "ExpoPushToken[abc]", platform: "ios" });

  assert.equal(fakes.rows.length, 1);
  const row = fakes.rows[0]!;
  assert.equal(row.token, "ExpoPushToken[abc]");
  assert.equal(row.userId, "user-1");
  assert.equal(row.platform, "ios");
  assert.ok(row.createdAt.getTime() >= before);
  assert.equal(row.createdAt.getTime(), row.lastSeenAt.getTime());
});

test("register: тот же token у того же user → upsert обновляет lastSeenAt, не дублирует", async () => {
  const { service, fakes } = makeService([
    {
      token: "ExpoPushToken[abc]",
      userId: "user-1",
      platform: "ios",
      createdAt: new Date("2026-04-01T00:00:00Z"),
      lastSeenAt: new Date("2026-04-01T00:00:00Z"),
    },
  ]);

  await service.register("user-1", { token: "ExpoPushToken[abc]", platform: "ios" });

  assert.equal(fakes.rows.length, 1);
  assert.ok(fakes.rows[0]!.lastSeenAt > new Date("2026-04-01T00:00:00Z"));
});

test("register: тот же token у другого user (logout/login) → user_id переписывается", async () => {
  const { service, fakes } = makeService([
    {
      token: "ExpoPushToken[abc]",
      userId: "user-1",
      platform: "ios",
      createdAt: new Date("2026-04-01T00:00:00Z"),
      lastSeenAt: new Date("2026-04-01T00:00:00Z"),
    },
  ]);

  await service.register("user-2", { token: "ExpoPushToken[abc]", platform: "ios" });

  assert.equal(fakes.rows.length, 1);
  assert.equal(fakes.rows[0]!.userId, "user-2");
});

test("register: невалидная platform → ValidationError", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.register("user-1", { token: "x", platform: "windows-phone" }),
    /platform/i,
  );
});

test("register: пустой token → ValidationError", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.register("user-1", { token: "", platform: "ios" }),
    /token/i,
  );
});

test("getTokensForUser: возвращает все токены user'а", async () => {
  const { service } = makeService([
    {
      token: "T1",
      userId: "user-1",
      platform: "ios",
      createdAt: new Date(),
      lastSeenAt: new Date(),
    },
    {
      token: "T2",
      userId: "user-1",
      platform: "android",
      createdAt: new Date(),
      lastSeenAt: new Date(),
    },
    {
      token: "T3",
      userId: "user-2",
      platform: "ios",
      createdAt: new Date(),
      lastSeenAt: new Date(),
    },
  ]);

  const tokens = await service.getTokensForUser("user-1");

  assert.deepEqual(
    tokens.map((t) => t.token).sort(),
    ["T1", "T2"],
  );
});

test("removeToken: удаляет токен по строке", async () => {
  const { service, fakes } = makeService([
    {
      token: "T1",
      userId: "user-1",
      platform: "ios",
      createdAt: new Date(),
      lastSeenAt: new Date(),
    },
  ]);

  await service.removeToken("T1");

  assert.equal(fakes.rows.length, 0);
});
