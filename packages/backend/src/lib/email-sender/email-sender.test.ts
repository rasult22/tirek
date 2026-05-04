import { test } from "node:test";
import assert from "node:assert/strict";

import { createEmailSender } from "./email-sender.js";
import type { MailerLike, RenderedEmail } from "./email-sender.js";
import type { Language } from "@tirek/shared/i18n";

type SentMail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function makeMailer(opts: {
  onSend?: (mail: SentMail) => void;
  fail?: () => Error;
} = {}): MailerLike {
  return {
    async sendMail(mail) {
      if (opts.fail) throw opts.fail();
      opts.onSend?.(mail);
      return { messageId: `msg-${mail.to}` };
    },
  };
}

function fakeRender(label: string): (code: string, lang: Language) => RenderedEmail {
  // Фиктивный renderer, чтобы тест не зависел от реального шаблона.
  return (code, lang) => ({
    subject: `[${label}] subject ${lang}`,
    text: `[${label}] text ${lang} ${code}`,
    html: `[${label}] <b>html ${lang} ${code}</b>`,
  });
}

test("sendResetCode: дёргает mailer с from/to и полями из шаблона", async () => {
  let sent: SentMail | undefined;
  const mailer = makeMailer({ onSend: (m) => (sent = m) });
  const sender = createEmailSender({
    mailer,
    from: "noreply@tirek.kz",
    renderResetCode: fakeRender("T"),
  });

  const result = await sender.sendResetCode("aigerim@example.com", "4827", "ru");

  assert.deepEqual(result, { ok: true });
  assert.ok(sent, "mailer.sendMail должен быть вызван");
  assert.equal(sent!.from, "noreply@tirek.kz");
  assert.equal(sent!.to, "aigerim@example.com");
  assert.equal(sent!.subject, "[T] subject ru");
  assert.equal(sent!.text, "[T] text ru 4827");
  assert.equal(sent!.html, "[T] <b>html ru 4827</b>");
});

test("sendResetCode: renderResetCode получает code и lang без изменений", async () => {
  const calls: { code: string; lang: Language }[] = [];
  const mailer = makeMailer();
  const sender = createEmailSender({
    mailer,
    from: "noreply@tirek.kz",
    renderResetCode: (code, lang) => {
      calls.push({ code, lang });
      return { subject: "s", text: "t", html: "h" };
    },
  });

  await sender.sendResetCode("a@b.com", "1059", "kz");

  assert.deepEqual(calls, [{ code: "1059", lang: "kz" }]);
});

test("sendResetCode: ошибка транспорта → {ok: false, error}, не пробрасывает, логирует warn", async () => {
  const warnings: { msg: string; ctx?: Record<string, unknown> }[] = [];
  const mailer = makeMailer({ fail: () => new Error("SMTP timeout") });
  const sender = createEmailSender({
    mailer,
    from: "noreply@tirek.kz",
    renderResetCode: fakeRender("T"),
    logger: { warn: (msg, ctx) => warnings.push({ msg, ctx }) },
  });

  const result = await sender.sendResetCode("a@b.com", "0000", "ru");

  assert.deepEqual(result, { ok: false, error: "SMTP timeout" });
  assert.ok(warnings.length >= 1, "ожидался хотя бы один warn");
  assert.match(warnings[0]!.msg, /SMTP timeout/);
});
