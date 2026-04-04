import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../db/index.js";
import {
  sosEvents,
  notifications,
  studentPsychologist,
  users,
} from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// ── Crisis keyword lists (Russian + Kazakh) ────────────────────────

const HIGH_SEVERITY_KEYWORDS = [
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

const MEDIUM_SEVERITY_KEYWORDS = [
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

const LOW_SEVERITY_KEYWORDS = [
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

function detectMarkers(
  message: string,
): { severity: "low" | "medium" | "high"; markers: string[] } | null {
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

export const crisisDetectionTool = createTool({
  id: "crisis-detection",
  description:
    "Detects crisis markers in a user message (suicidal ideation, self-harm, abuse, severe distress) and creates SOS events with psychologist notifications when needed.",
  inputSchema: z.object({
    message: z.string().describe("The user message to analyze for crisis markers"),
    userId: z.string().describe("The ID of the user who sent the message"),
    sessionId: z.string().describe("The chat session ID"),
  }),
  outputSchema: z.object({
    isCrisis: z.boolean(),
    severity: z.enum(["low", "medium", "high"]),
    markers: z.array(z.string()),
    response: z.string(),
  }),
  execute: async ({ context }) => {
    const { message, userId, sessionId } = context;

    const result = detectMarkers(message);

    if (!result) {
      return {
        isCrisis: false,
        severity: "low" as const,
        markers: [],
        response: "",
      };
    }

    const { severity, markers } = result;

    // Create SOS event for high and medium severity
    if (severity === "high" || severity === "medium") {
      const sosLevel = severity === "high" ? 2 : 1;
      const sosId = uuidv4();

      try {
        await db.insert(sosEvents).values({
          id: sosId,
          userId,
          level: sosLevel,
          notes: `Auto-detected crisis in chat session ${sessionId}. Markers: ${markers.join(", ")}`,
        });

        // Find linked psychologists and create notifications
        const linkedPsychologists = await db
          .select({
            psychologistId: studentPsychologist.psychologistId,
            psychologistName: users.name,
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
        console.error("Failed to create SOS event or notifications:", error);
      }
    }

    // Build supportive response with hotline numbers
    let response: string;

    if (severity === "high") {
      response = [
        "Я очень переживаю за тебя. То, что ты чувствуешь — это серьёзно, и тебе нужна помощь живого специалиста прямо сейчас.",
        "",
        "📞 Пожалуйста, позвони по одному из этих номеров:",
        "• 150 — телефон доверия для детей и подростков",
        "• 111 — служба экстренной психологической помощи",
        "• 112 — единая служба спасения",
        "",
        "Ты также можешь обратиться к своему школьному психологу — это безопасно и конфиденциально.",
        "Ты не один/одна. Есть люди, которые хотят помочь тебе.",
      ].join("\n");
    } else if (severity === "medium") {
      response = [
        "Я слышу тебя, и мне важно, чтобы ты знал(а) — ты не одинок(а) в этом.",
        "",
        "То, что ты описываешь, — это ситуация, в которой лучше всего поможет живой специалист.",
        "Я очень рекомендую поговорить с твоим школьным психологом.",
        "",
        "📞 Ты также можешь позвонить:",
        "• 150 — телефон доверия для детей и подростков",
        "• 111 — служба экстренной психологической помощи",
        "",
        "Помни: просить о помощи — это проявление силы, а не слабости.",
      ].join("\n");
    } else {
      response = [
        "Я понимаю, что тебе сейчас непросто. Тревога и стресс — это нормальная реакция, и с этим можно справиться.",
        "",
        "Если чувствуешь, что тебе тяжело справляться самостоятельно, поговори с школьным психологом — он(а) поможет разобраться.",
        "",
        "📞 Телефон доверия: 150 (бесплатно, анонимно, круглосуточно)",
      ].join("\n");
    }

    return {
      isCrisis: true,
      severity,
      markers,
      response,
    };
  },
});
