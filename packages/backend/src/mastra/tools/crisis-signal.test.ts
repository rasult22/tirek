import { test } from "node:test";
import assert from "node:assert/strict";

import { executeCrisisSignal } from "./crisis-signal.execute.js";
import type {
  CrisisSignalRouterInput,
  CrisisSignalRouterResult,
} from "../../modules/crisis-signals/crisis-signal-router.js";

type RouterCall = CrisisSignalRouterInput;

function makeFakeRouter(
  result: CrisisSignalRouterResult = {
    signalId: "sig-1",
    feed: "red",
    notificationIds: ["n-1"],
  },
) {
  const calls: RouterCall[] = [];
  return {
    calls,
    router: {
      route: async (input: CrisisSignalRouterInput) => {
        calls.push(input);
        return result;
      },
    },
  };
}

test("acute_crisis input is routed with source=ai_friend and correct summary/severity", async () => {
  const { router, calls } = makeFakeRouter({
    signalId: "sig-1",
    feed: "red",
    notificationIds: ["n-1"],
  });

  const result = await executeCrisisSignal({
    router,
    logger: { error: () => {} },
    input: {
      userId: "stu-1",
      sessionId: "sess-1",
      type: "acute_crisis",
      severity: "high",
      markers: ["суицидальные мысли", "безнадёжность"],
      summary: "Ученик выразил нежелание жить после рассказа о буллинге",
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, "ai_friend");
  assert.equal(calls[0].studentId, "stu-1");
  assert.equal(calls[0].type, "acute_crisis");
  assert.equal(calls[0].severity, "high");
  assert.equal(
    calls[0].summary,
    "Ученик выразил нежелание жить после рассказа о буллинге",
  );
  assert.deepEqual(result, {
    recorded: true,
    signalId: "sig-1",
    feed: "red",
  });
});

test("concern carries category, markers and sessionId in router metadata", async () => {
  const { router, calls } = makeFakeRouter({
    signalId: "sig-2",
    feed: "yellow",
    notificationIds: ["n-2"],
  });

  const result = await executeCrisisSignal({
    router,
    logger: { error: () => {} },
    input: {
      userId: "stu-2",
      sessionId: "sess-9",
      type: "concern",
      severity: "medium",
      category: "bullying",
      markers: ["унижение в классе", "изоляция"],
      summary: "Систематический буллинг со стороны одноклассников",
    },
  });

  assert.equal(calls[0].type, "concern");
  assert.equal(calls[0].severity, "medium");
  assert.deepEqual(calls[0].metadata, {
    sessionId: "sess-9",
    category: "bullying",
    markers: ["унижение в классе", "изоляция"],
  });
  assert.equal(result.recorded, true);
  if (result.recorded) {
    assert.equal(result.feed, "yellow");
    assert.equal(result.signalId, "sig-2");
  }
});

test("router failure is logged and does not throw — agent stays alive", async () => {
  const errors: Array<{ msg: string; ctx?: Record<string, unknown> }> = [];
  const failingRouter = {
    route: async () => {
      throw new Error("db down");
    },
  };

  const result = await executeCrisisSignal({
    router: failingRouter,
    logger: { error: (msg, ctx) => errors.push({ msg, ctx }) },
    input: {
      userId: "stu-3",
      sessionId: "sess-3",
      type: "acute_crisis",
      severity: "high",
      markers: ["risk"],
      summary: "s",
    },
  });

  assert.deepEqual(result, { recorded: false });
  assert.equal(errors.length, 1);
  assert.equal(errors[0].ctx?.studentId, "stu-3");
});
