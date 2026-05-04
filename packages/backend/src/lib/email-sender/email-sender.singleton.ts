import { promises as dns } from "node:dns";
import nodemailer from "nodemailer";

import { env } from "../../config/env.js";
import { renderResetCodeEmail } from "../../modules/auth/email-templates.js";
import { createEmailSender } from "./email-sender.js";

async function buildSender() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  // Railway не имеет исходящего IPv6. Без этого nodemailer случайно выбирает
  // IPv6 из resolved-адресов (см. lib/shared/index.js: addresses[Math.random()])
  // и падает с ENETUNREACH 2a00:1450:...:587. Резолвим сами в IPv4 и
  // передаём готовый IP как host; servername нужен для TLS SNI.
  let host = SMTP_HOST;
  let servername: string | undefined;
  try {
    const ipv4 = await dns.resolve4(SMTP_HOST);
    if (ipv4.length > 0) {
      host = ipv4[0];
      servername = SMTP_HOST;
    }
  } catch (err) {
    console.warn(
      "[email-sender] resolve4 failed, falling back to hostname:",
      err,
    );
  }

  const transport = nodemailer.createTransport({
    host,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: servername ? { servername } : undefined,
  });
  return createEmailSender({
    mailer: transport,
    from: EMAIL_FROM ?? SMTP_USER,
    renderResetCode: renderResetCodeEmail,
  });
}

// null — если SMTP_* не сконфигурированы (локальный dev, CI). Вызывающий код
// должен проверить и решить: не отправлять, либо ругнуться.
// Top-level await: backend — ESM, все callers подгружают этот модуль через import.
export const emailSender = await buildSender();
