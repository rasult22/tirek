import { test } from "node:test";
import assert from "node:assert/strict";

import { executePsychologistRedirect } from "./psychologist-redirect.execute.js";

test("returns redirect hint with reason — no side effects, no router/db deps", async () => {
  const result = await executePsychologistRedirect({
    reason: "Поссорился с подругой, переживает",
  });

  assert.deepEqual(result, {
    hint: "psychologist_redirect",
    reason: "Поссорился с подругой, переживает",
  });
});
