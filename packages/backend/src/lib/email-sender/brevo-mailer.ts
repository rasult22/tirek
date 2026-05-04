// HTTP-транспорт для Brevo (ex-Sendinblue) Transactional API.
// Реализует MailerLike, чтобы createEmailSender работал без изменений.
// Railway блокирует исходящий SMTP — все email шлём только по HTTPS.

import type { MailerLike } from "./email-sender.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type BrevoMailerOptions = {
  apiKey: string;
  /** Опциональный fetch — для тестов; по умолчанию глобальный fetch. */
  fetch?: typeof fetch;
};

export function createBrevoMailer(opts: BrevoMailerOptions): MailerLike {
  const fetchImpl = opts.fetch ?? fetch;
  return {
    async sendMail({ from, to, subject, text, html }) {
      const sender = parseAddress(from);
      const recipient = parseAddress(to);

      const res = await fetchImpl(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": opts.apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [recipient],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Brevo HTTP ${res.status}: ${body || res.statusText}`);
      }

      const data = (await res.json().catch(() => ({}))) as {
        messageId?: string;
      };
      return { messageId: data.messageId ?? "" };
    },
  };
}

// "Имя <email@host>" → { name, email }; иначе { email }.
function parseAddress(value: string): { name?: string; email: string } {
  const match = /^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/.exec(value);
  if (match) {
    return { name: match[1], email: match[2] };
  }
  return { email: value.trim() };
}
