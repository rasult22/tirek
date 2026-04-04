import { db } from "../db/index.js";
import {
  sosEvents,
  notifications,
  studentPsychologist,
  users,
  chatMessages,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// ── Crisis keyword lists (Russian + Kazakh) ────────────────────────

export const HIGH_SEVERITY_KEYWORDS = [
  // Russian
  "суицид",
  "убить себя",
  "не хочу жить",
  "хочу умереть",
  "покончить с собой",
  "покончу с собой",
  "резать себя",
  "порезать себя",
  "повеситься",
  "прыгнуть с крыши",
  "выпить таблетки",
  "отравиться",
  "конец жизни",
  "нет смысла жить",
  "лучше бы меня не было",
  "хочу исчезнуть навсегда",
  // Kazakh
  "өзімді өлтіргім келеді",
  "өлгім келеді",
  "өмір сүргім келмейді",
  "тірі болғым келмейді",
  "өзіме зиян келтіру",
  "өзімді кескім келеді",
];

export const MEDIUM_SEVERITY_KEYWORDS = [
  // Russian
  "никто не поможет",
  "все бесполезно",
  "мне конец",
  "я ничтожество",
  "я никому не нужен",
  "я никому не нужна",
  "бьют",
  "бьёт",
  "буллинг",
  "издеваются",
  "насилие",
  "домашнее насилие",
  "избивают",
  "трогают",
  "домогаются",
  "я ненавижу себя",
  "я урод",
  "все ненавидят меня",
  "я одинок",
  "я одинока",
  "никто не любит",
  // Kazakh
  "ешкім көмектеспейді",
  "бәрі пайдасыз",
  "мені ұрады",
  "мені қорлайды",
  "зорлық-зомбылық",
  "буллинг",
  "мен ешкімге керек емеспін",
];

export const LOW_SEVERITY_KEYWORDS = [
  // Russian
  "тревога",
  "тревожность",
  "паника",
  "не могу дышать",
  "панические атаки",
  "паническая атака",
  "сильный стресс",
  "не могу спать",
  "бессонница",
  "плачу каждый день",
  "постоянно плачу",
  "нет сил",
  "всё плохо",
  // Kazakh
  "үрей",
  "дүрбелең",
  "тыныс ала алмаймын",
  "панике",
  "ұйықтай алмаймын",
  "күнде жылаймын",
];

export type CrisisSeverity = "low" | "medium" | "high";

export interface CrisisDetectionResult {
  severity: CrisisSeverity;
  markers: string[];
}

export function detectMarkers(
  message: string,
): CrisisDetectionResult | null {
  const lower = message.toLowerCase();

  const highMatches = HIGH_SEVERITY_KEYWORDS.filter((kw) =>
    lower.includes(kw.toLowerCase()),
  );
  if (highMatches.length > 0) {
    return { severity: "high", markers: highMatches };
  }

  const mediumMatches = MEDIUM_SEVERITY_KEYWORDS.filter((kw) =>
    lower.includes(kw.toLowerCase()),
  );
  if (mediumMatches.length > 0) {
    return { severity: "medium", markers: mediumMatches };
  }

  const lowMatches = LOW_SEVERITY_KEYWORDS.filter((kw) =>
    lower.includes(kw.toLowerCase()),
  );
  if (lowMatches.length > 0) {
    return { severity: "low", markers: lowMatches };
  }

  return null;
}

/**
 * Run mandatory crisis check on every incoming student message.
 * If high/medium markers detected → create SOS event + notify psychologists + flag message.
 */
export async function runMandatoryCrisisCheck(
  message: string,
  userId: string,
  sessionId: string,
  messageId: number,
): Promise<{ detected: boolean; severity?: CrisisSeverity; markers?: string[] }> {
  const result = detectMarkers(message);

  if (!result) {
    return { detected: false };
  }

  const { severity, markers } = result;

  // Only create SOS events for high and medium severity
  if (severity === "high" || severity === "medium") {
    const sosLevel = severity === "high" ? 2 : 1;
    const sosId = uuidv4();

    try {
      // Flag the message
      await db
        .update(chatMessages)
        .set({ flagged: true })
        .where(eq(chatMessages.id, messageId));

      // Create SOS event
      await db.insert(sosEvents).values({
        id: sosId,
        userId,
        level: sosLevel,
        notes: `Auto-detected crisis in chat session ${sessionId}. Markers: ${markers.join(", ")}`,
      });

      // Find linked psychologists and notify
      const linkedPsychologists = await db
        .select({
          psychologistId: studentPsychologist.psychologistId,
        })
        .from(studentPsychologist)
        .innerJoin(users, eq(users.id, studentPsychologist.psychologistId))
        .where(eq(studentPsychologist.studentId, userId));

      for (const psych of linkedPsychologists) {
        await db.insert(notifications).values({
          id: uuidv4(),
          userId: psych.psychologistId,
          type: "sos_alert",
          title:
            severity === "high"
              ? "🚨 СРОЧНО: Обнаружены критические маркеры кризиса"
              : "⚠️ Внимание: Обнаружены маркеры кризиса",
          body: `У ученика обнаружены признаки кризисной ситуации (уровень: ${severity}). Требуется внимание специалиста.`,
          metadata: {
            sosEventId: sosId,
            sessionId,
            severity,
            markers,
          },
        });
      }
    } catch (error) {
      console.error("Mandatory crisis check — failed to create SOS/notifications:", error);
    }
  }

  return { detected: true, severity, markers };
}
