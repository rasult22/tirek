import { test } from "node:test";
import assert from "node:assert/strict";

import { renderResetCodeEmail } from "./email-templates.js";

test("renderResetCodeEmail(ru): тема и код в text/html", () => {
  const email = renderResetCodeEmail("4827", "ru");

  assert.equal(email.subject, "Tirek — код для восстановления пароля");
  assert.match(email.text, /4827/);
  assert.match(email.html, /4827/);
});

test("renderResetCodeEmail(kz): тема и код в text/html", () => {
  const email = renderResetCodeEmail("1059", "kz");

  assert.equal(email.subject, "Tirek — құпиясөзді қалпына келтіру коды");
  assert.match(email.text, /1059/);
  assert.match(email.html, /1059/);
});

test("renderResetCodeEmail: unknown lang → fallback на RU", () => {
  const email = renderResetCodeEmail("0001", "en" as never);

  assert.equal(email.subject, "Tirek — код для восстановления пароля");
});

test("renderResetCodeEmail(ru): TTL 15 минут и фраза 'не запрашивали — игнорируйте' в text и html", () => {
  const email = renderResetCodeEmail("4827", "ru");

  for (const body of [email.text, email.html]) {
    assert.match(body, /15 минут/);
    assert.match(body, /не запрашивали.*игнорируйте/i);
  }
});

test("renderResetCodeEmail(kz): TTL 15 минут и фраза 'сұраныс жасамаған болсаңыз — елемеңіз' в text и html", () => {
  const email = renderResetCodeEmail("1059", "kz");

  for (const body of [email.text, email.html]) {
    assert.match(body, /15 минут/);
    assert.match(body, /сұраныс жасамаған болсаңыз.*елемеңіз/i);
  }
});

test("renderResetCodeEmail: html отрисовывает код крупно (большой font-size + letter-spacing)", () => {
  const email = renderResetCodeEmail("4827", "ru");

  // Крупно = font-size явно задан и не маленький; letter-spacing для разрядки.
  assert.match(email.html, /font-size:\s*\d{2,}/);
  assert.match(email.html, /letter-spacing/);
});
