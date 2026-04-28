import { renderPrintProfileHtml } from "@tirek/shared/format-print-profile";
import type {
  BuildPrintProfileInput,
  PrintProfileLang,
} from "@tirek/shared/format-print-profile";
import { buildPrintProfile } from "@tirek/shared/format-print-profile";

export function openPrintProfile(
  input: BuildPrintProfileInput,
  lang: PrintProfileLang,
): void {
  const profile = buildPrintProfile(input);
  const html = renderPrintProfileHtml(profile, lang);
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) {
    throw new Error("popup_blocked");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Дождаться парсинга, затем вызвать диалог печати
  w.addEventListener("load", () => {
    w.focus();
    w.print();
  });
}
