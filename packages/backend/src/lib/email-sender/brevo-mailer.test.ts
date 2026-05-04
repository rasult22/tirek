import { test } from "node:test";
import assert from "node:assert/strict";

import { createBrevoMailer } from "./brevo-mailer.js";

type Captured = {
  url: string;
  init: RequestInit;
};

function makeFetch(opts: {
  status?: number;
  body?: unknown;
  capture?: (req: Captured) => void;
}): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    opts.capture?.({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(opts.body ?? { messageId: "msg-1" }), {
      status: opts.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

test("brevo-mailer: POST на /v3/smtp/email с api-key в headers", async () => {
  let captured: Captured | undefined;
  const mailer = createBrevoMailer({
    apiKey: "test-key",
    fetch: makeFetch({ capture: (r) => (captured = r) }),
  });

  await mailer.sendMail({
    from: "sender@tirek.kz",
    to: "user@example.com",
    subject: "Subj",
    text: "plain",
    html: "<b>html</b>",
  });

  assert.ok(captured, "fetch должен быть вызван");
  assert.equal(captured!.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(captured!.init.method, "POST");
  const headers = captured!.init.headers as Record<string, string>;
  assert.equal(headers["api-key"], "test-key");
  assert.equal(headers["content-type"], "application/json");
});

test("brevo-mailer: body содержит sender/to/subject/htmlContent/textContent", async () => {
  let captured: Captured | undefined;
  const mailer = createBrevoMailer({
    apiKey: "k",
    fetch: makeFetch({ capture: (r) => (captured = r) }),
  });

  await mailer.sendMail({
    from: "noreply@tirek.kz",
    to: "alia@school.kz",
    subject: "Reset code",
    text: "Code: 4827",
    html: "<p>Code: 4827</p>",
  });

  const body = JSON.parse(captured!.init.body as string);
  assert.deepEqual(body.sender, { email: "noreply@tirek.kz" });
  assert.deepEqual(body.to, [{ email: "alia@school.kz" }]);
  assert.equal(body.subject, "Reset code");
  assert.equal(body.htmlContent, "<p>Code: 4827</p>");
  assert.equal(body.textContent, "Code: 4827");
});

test("brevo-mailer: from в формате 'Name <email>' парсится в sender.name + sender.email", async () => {
  let captured: Captured | undefined;
  const mailer = createBrevoMailer({
    apiKey: "k",
    fetch: makeFetch({ capture: (r) => (captured = r) }),
  });

  await mailer.sendMail({
    from: "Tirek <noreply@tirek.kz>",
    to: "u@e.com",
    subject: "S",
    text: "t",
    html: "h",
  });

  const body = JSON.parse(captured!.init.body as string);
  assert.deepEqual(body.sender, { name: "Tirek", email: "noreply@tirek.kz" });
});

test("brevo-mailer: non-2xx → выбрасывает Error со статусом", async () => {
  const mailer = createBrevoMailer({
    apiKey: "k",
    fetch: makeFetch({ status: 401, body: { message: "unauthorized" } }),
  });

  await assert.rejects(
    () =>
      mailer.sendMail({
        from: "f@e.com",
        to: "t@e.com",
        subject: "s",
        text: "t",
        html: "h",
      }),
    /Brevo HTTP 401/,
  );
});

test("brevo-mailer: возвращает messageId из ответа", async () => {
  const mailer = createBrevoMailer({
    apiKey: "k",
    fetch: makeFetch({ body: { messageId: "abc-123" } }),
  });

  const res = await mailer.sendMail({
    from: "f@e.com",
    to: "t@e.com",
    subject: "s",
    text: "t",
    html: "h",
  });

  assert.equal(res.messageId, "abc-123");
});
