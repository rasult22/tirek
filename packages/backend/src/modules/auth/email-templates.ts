import type { Language } from "@tirek/shared/i18n";

export type ResetCodeEmail = {
  subject: string;
  text: string;
  html: string;
};

const CODE_HTML_STYLE =
  "font-size: 36px; letter-spacing: 12px; font-weight: 700; font-family: Inter, Arial, sans-serif; margin: 24px 0;";

const WRAPPER_HTML_STYLE =
  "font-family: Inter, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #111;";

function htmlBody(intro: string, code: string, ttl: string, disclaimer: string): string {
  return [
    `<div style="${WRAPPER_HTML_STYLE}">`,
    `<p>${intro}</p>`,
    `<p style="${CODE_HTML_STYLE}">${code}</p>`,
    `<p>${ttl}</p>`,
    `<p style="color: #666;">${disclaimer}</p>`,
    `</div>`,
  ].join("");
}

function ru(code: string): ResetCodeEmail {
  const intro = "Ваш код для восстановления пароля:";
  const ttl = "Код действителен 15 минут.";
  const disclaimer = "Если вы не запрашивали восстановление — игнорируйте это письмо.";
  return {
    subject: "Tirek — код для восстановления пароля",
    text: `${intro}\n\n${code}\n\n${ttl}\n\n${disclaimer}`,
    html: htmlBody(intro, code, ttl, disclaimer),
  };
}

function kz(code: string): ResetCodeEmail {
  const intro = "Құпиясөзді қалпына келтіру кодыңыз:";
  // TTL фраза содержит "15 минут" буквально (acceptance), плюс kz-обвязка.
  const ttl = "Код 15 минут ішінде жарамды.";
  const disclaimer = "Егер сұраныс жасамаған болсаңыз — бұл хатты елемеңіз.";
  return {
    subject: "Tirek — құпиясөзді қалпына келтіру коды",
    text: `${intro}\n\n${code}\n\n${ttl}\n\n${disclaimer}`,
    html: htmlBody(intro, code, ttl, disclaimer),
  };
}

export function renderResetCodeEmail(code: string, lang: Language): ResetCodeEmail {
  if (lang === "kz") return kz(code);
  return ru(code);
}
