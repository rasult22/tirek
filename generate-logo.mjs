import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const GEMINI_API_KEY = "AIzaSyCYenC7DTlXq62tk7qFAPgL1dAbx5Zt8EY";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Варианты промптов для логотипа Тірек ---

const prompts = {
  // Вариант 1: Минималистичный иконочный логотип
  minimalist: `A clean minimalist flat vector logo for a psychology support app called "TIREK".
The logo features a stylized shield or pillar shape (representing "support/foundation" in Kazakh)
combined with a subtle heart or brain silhouette. Color palette: primary blue #1A73E8 with soft
teal accents. The text "ТІРЕК" is displayed below the icon in a bold modern geometric sans-serif
typeface. Clean lines, simple geometric shapes, flat vector SVG style, recognizable at small sizes,
works as a favicon. Isolated on pure white background. Professional, warm, trustworthy.`,

  // Вариант 2: Абстрактный геометрический
  geometric: `A professional geometric logo for "TIREK" — a digital mental health platform for
school students in Kazakhstan. The icon is an abstract upward-growing tree formed by simple
geometric shapes — circles and lines — symbolizing growth, support and psychological wellbeing.
The color scheme uses calming blue #1A73E8 as primary and soft green as secondary accent.
The text "ТІРЕК" appears in clean sans-serif font below the icon. Flat vector rendering,
minimal details, clean white background, SVG style, sharp edges. The logo should feel safe,
warm, and approachable for teenagers.`,

  // Вариант 3: Lettermark + символ
  lettermark: `A minimalistic vector lettermark logo combining the Cyrillic letter "Т" with a
visual metaphor of a supportive hand or rising pillar. The design is modern, geometric, and
uses blue #1A73E8 as the primary color. Below the icon the full name "ТІРЕК" is written in a
clean, rounded sans-serif font. The overall style is flat, professional, suitable for a mobile
app icon. Recognizable at 32x32px. Isolated on white background. No gradients, no shadows,
pure flat vector design.`,

  // Вариант 4: Дружелюбный для подростков
  friendly: `A friendly, approachable logo for "TIREK" — a mental wellness app for teenagers.
The icon shows a stylized smiling seedling or small tree growing from a solid foundation/base,
representing growth and support. Rounded shapes, soft corners, warm and inviting feel.
Primary color: vibrant blue #1A73E8 with soft yellow-green leaf accents. The text "ТІРЕК"
is in a friendly rounded sans-serif typeface. Flat vector style, clean white background,
simple enough to work as a mobile app icon. No complex details, no realistic textures.`,

  // Вариант 5: Щит + сердце (символ защиты и заботы)
  shield: `A clean, modern logo for "TIREK" mental health platform. The icon combines a
protective shield outline with a heart shape integrated inside, symbolizing safety and care.
The shield has soft rounded corners to feel approachable rather than aggressive. Color:
solid blue #1A73E8 for the shield, lighter blue for the heart interior. The text "ТІРЕК"
appears below in a bold, geometric sans-serif font. Flat vector, SVG style, minimal,
professional, isolated on white background. Works perfectly as a 1024x1024 app icon.`,
};

async function generateLogo(name, prompt) {
  console.log(`\n🎨 Генерация варианта: ${name}...`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    let imageCount = 0;
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log(`  📝 Ответ модели: ${part.text.slice(0, 100)}...`);
      } else if (part.inlineData) {
        imageCount++;
        const filename = `logo_${name}${imageCount > 1 ? `_${imageCount}` : ""}.png`;
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(filename, buffer);
        console.log(`  ✅ Сохранено: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
      }
    }

    if (imageCount === 0) {
      console.log("  ⚠️  Изображение не было сгенерировано. Возможно, нужен billing tier.");
    }
  } catch (err) {
    console.error(`  ❌ Ошибка: ${err.message}`);
    if (err.message.includes("billing") || err.message.includes("quota")) {
      console.error("  💡 Подсказка: для генерации изображений нужен Google Cloud billing tier 1+");
    }
  }
}

// --- Запуск ---

const selectedVariant = process.argv[2];

if (selectedVariant && prompts[selectedVariant]) {
  // Генерация одного конкретного варианта
  await generateLogo(selectedVariant, prompts[selectedVariant]);
} else if (selectedVariant === "all") {
  // Генерация всех вариантов
  for (const [name, prompt] of Object.entries(prompts)) {
    await generateLogo(name, prompt);
  }
} else {
  // По умолчанию — показать варианты
  console.log("Генератор логотипа Тірек (Nano Banana / Gemini Image API)\n");
  console.log("Использование:");
  console.log("  node generate-logo.mjs <variant>    — один вариант");
  console.log("  node generate-logo.mjs all           — все варианты\n");
  console.log("Доступные варианты:");
  for (const name of Object.keys(prompts)) {
    console.log(`  - ${name}`);
  }
  console.log("\nПример: node generate-logo.mjs minimalist");
  console.log("\nЗапускаю вариант 'minimalist' по умолчанию...\n");

  await generateLogo("minimalist", prompts.minimalist);
}
