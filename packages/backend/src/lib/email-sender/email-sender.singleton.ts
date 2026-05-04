import { env } from "../../config/env.js";
import { renderResetCodeEmail } from "../../modules/auth/email-templates.js";
import { createBrevoMailer } from "./brevo-mailer.js";
import { createEmailSender } from "./email-sender.js";

function buildSender() {
  const { BREVO_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME } = env;
  if (!BREVO_API_KEY || !EMAIL_FROM) {
    return null;
  }
  const from = EMAIL_FROM_NAME
    ? `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`
    : EMAIL_FROM;
  return createEmailSender({
    mailer: createBrevoMailer({ apiKey: BREVO_API_KEY }),
    from,
    renderResetCode: renderResetCodeEmail,
  });
}

// null — если BREVO_API_KEY/EMAIL_FROM не сконфигурированы (локальный dev, CI).
// Вызывающий код должен проверить и решить: не отправлять, либо ругнуться.
export const emailSender = buildSender();
