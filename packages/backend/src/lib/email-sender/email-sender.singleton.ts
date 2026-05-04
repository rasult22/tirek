import nodemailer from "nodemailer";

import { env } from "../../config/env.js";
import { renderResetCodeEmail } from "../../modules/auth/email-templates.js";
import { createEmailSender } from "./email-sender.js";

function buildSender() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return createEmailSender({
    mailer: transport,
    from: EMAIL_FROM ?? SMTP_USER,
    renderResetCode: renderResetCodeEmail,
  });
}

// null — если SMTP_* не сконфигурированы (локальный dev, CI). Вызывающий код
// должен проверить и решить: не отправлять, либо ругнуться.
export const emailSender = buildSender();
