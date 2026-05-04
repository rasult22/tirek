// Deep module: тонкая обёртка над nodemailer-подобным транспортом.
// Берёт шаблон по `lang` через инжектируемый `renderResetCode` и шлёт письмо.
// Ошибки транспорта не пробрасывает — логирует и возвращает {ok: false}.

import type { Language } from "@tirek/shared/i18n";

export type MailerLike = {
  sendMail(opts: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<{ messageId: string }>;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export type EmailSenderDeps = {
  mailer: MailerLike;
  from: string;
  renderResetCode: (code: string, lang: Language) => RenderedEmail;
  logger?: { warn: (msg: string, ctx?: Record<string, unknown>) => void };
};

export type SendResult =
  | { ok: true }
  | { ok: false; error: string };

export function createEmailSender(deps: EmailSenderDeps) {
  const logger = deps.logger ?? {
    warn: (msg, ctx) => console.warn(`[email-sender] ${msg}`, ctx ?? {}),
  };

  return {
    async sendResetCode(email: string, code: string, lang: Language): Promise<SendResult> {
      const template = deps.renderResetCode(code, lang);
      try {
        await deps.mailer.sendMail({
          from: deps.from,
          to: email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        return { ok: true };
      } catch (err) {
        const message = (err as Error).message;
        logger.warn(`sendResetCode failed: ${message}`, { to: email });
        return { ok: false, error: message };
      }
    },
  };
}
