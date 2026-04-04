import { db } from "./index.js";
import { users, diagnosticTests, exercises, contentQuotes } from "./schema.js";
import { testDefinitions } from "../../../shared/src/constants/test-definitions.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── 1. Demo psychologist ────────────────────────────────────────────
  const psychologistId = uuidv4();
  const passwordHash = await bcrypt.hash("demo123456", 10);

  await db
    .insert(users)
    .values({
      id: psychologistId,
      email: "psychologist@tirek.kz",
      passwordHash,
      name: "Айгуль Нурланова",
      role: "psychologist",
      language: "ru",
    })
    .onConflictDoNothing();

  console.log("  ✓ Demo psychologist: psychologist@tirek.kz / demo123456");

  // ── 2. Diagnostic tests ─────────────────────────────────────────────
  for (const [slug, def] of Object.entries(testDefinitions)) {
    await db
      .insert(diagnosticTests)
      .values({
        id: uuidv4(),
        slug: def.slug,
        nameRu: def.nameRu,
        nameKz: def.nameKz,
        description: def.descriptionRu,
        questions: def.questions,
        scoringRules: {
          options: def.options,
          thresholds: def.scoringRules,
          reverseItems: def.reverseItems,
          maxScore: def.maxScore,
        },
        questionCount: def.questions.length,
      })
      .onConflictDoNothing();
  }
  console.log("  ✓ 3 diagnostic tests (PHQ-A, GAD-7, Rosenberg)");

  // ── 3. Breathing exercises ──────────────────────────────────────────
  const exerciseData = [
    {
      id: uuidv4(),
      type: "breathing",
      slug: "square-breathing",
      nameRu: "Квадратное дыхание",
      nameKz: "Шаршы тыныс алу",
      description: "Вдох — задержка — выдох — задержка по 4 секунды",
      config: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 4, shape: "square" },
    },
    {
      id: uuidv4(),
      type: "breathing",
      slug: "breathing-478",
      nameRu: "Дыхание 4-7-8",
      nameKz: "4-7-8 тыныс алу",
      description: "Вдох 4 сек — задержка 7 сек — выдох 8 сек",
      config: { inhale: 4, hold: 7, exhale: 8, cycles: 3, shape: "circle" },
    },
    {
      id: uuidv4(),
      type: "breathing",
      slug: "diaphragmatic",
      nameRu: "Диафрагмальное дыхание",
      nameKz: "Диафрагмалық тыныс алу",
      description: "Глубокое дыхание животом",
      config: { inhale: 4, exhale: 6, cycles: 5, shape: "balloon" },
    },
  ];

  for (const ex of exerciseData) {
    await db.insert(exercises).values(ex).onConflictDoNothing();
  }
  console.log("  ✓ 3 breathing exercises");

  // ── 4. Motivational quotes ──────────────────────────────────────────
  const quotes = [
    // Мотивация (RU)
    { textRu: "Ты сильнее, чем думаешь, и храбрее, чем кажешься.", textKz: "Сен ойлағаннан күштісің және көрінгеннен батылсың.", category: "motivation" },
    { textRu: "Каждый день — это новый шанс стать лучше.", textKz: "Әр күн — жақсырақ болуға жаңа мүмкіндік.", category: "motivation" },
    { textRu: "Не бойся ошибок — они делают тебя мудрее.", textKz: "Қателіктен қорықпа — олар сені данарақ етеді.", category: "motivation" },
    { textRu: "Маленькие шаги ведут к большим переменам.", textKz: "Кішкентай қадамдар үлкен өзгерістерге апарады.", category: "motivation" },
    { textRu: "Верь в себя — ты способен на удивительные вещи.", textKz: "Өзіңе сен — сен таңғажайып нәрселерге қабілеттісің.", category: "motivation" },
    { textRu: "Твоё настроение — это погода, а не климат. Оно пройдёт.", textKz: "Сенің көңіл-күйің — ауа райы, климат емес. Ол өтеді.", category: "motivation" },
    { textRu: "Просить помощи — это проявление силы, а не слабости.", textKz: "Көмек сұрау — әлсіздік емес, күштің белгісі.", category: "motivation" },
    { textRu: "Ты не один. Рядом всегда есть те, кто готов помочь.", textKz: "Сен жалғыз емессің. Көмекке дайын адамдар қасыңда.", category: "motivation" },
    { textRu: "Заботиться о себе — не эгоизм, а необходимость.", textKz: "Өзіңе қамқорлық — эгоизм емес, қажеттілік.", category: "motivation" },
    { textRu: "Всё, что тебе нужно, уже внутри тебя.", textKz: "Саған қажет нәрсенің бәрі сенің ішіңде.", category: "motivation" },
    { textRu: "Даже самая длинная дорога начинается с первого шага.", textKz: "Ең ұзақ жол да алғашқы қадамнан басталады.", category: "motivation" },
    { textRu: "Ты заслуживаешь доброты — в том числе от себя.", textKz: "Сен мейірімге лайықсың — оның ішінде өзіңнен де.", category: "motivation" },

    // Казахские пословицы
    { textRu: "Терпение — золото. (Сабыр түбі — сары алтын)", textKz: "Сабыр түбі — сары алтын.", category: "proverb" },
    { textRu: "Один за всех, все за одного. (Біреу бәрі үшін, бәрі біреу үшін)", textKz: "Біреу бәрі үшін, бәрі біреу үшін.", category: "proverb" },
    { textRu: "Знание — сила. (Білім — күш)", textKz: "Білім — күш.", category: "proverb" },
    { textRu: "Дерево крепко корнями, а человек — друзьями. (Ағаш тамырымен мықты, адам — достарымен)", textKz: "Ағаш тамырымен мықты, адам — достарымен.", category: "proverb" },
    { textRu: "Кто рано встаёт, тому бог подаёт. (Ерте тұрған ердің ырысы артық)", textKz: "Ерте тұрған ердің ырысы артық.", category: "proverb" },
    { textRu: "Слово — серебро, молчание — золото. (Сөз — күміс, тыйылу — алтын)", textKz: "Сөз — күміс, тыйылу — алтын.", category: "proverb" },
    { textRu: "У дружбы нет границ. (Достықтың шегі жоқ)", textKz: "Достықтың шегі жоқ.", category: "proverb" },
    { textRu: "Единство — это сила. (Бірлік бар жерде — тірлік бар)", textKz: "Бірлік бар жерде — тірлік бар.", category: "proverb" },
    { textRu: "Труд — отец счастья. (Еңбек — ердің бақыты)", textKz: "Еңбек — ердің бақыты.", category: "proverb" },
    { textRu: "Учиться никогда не поздно. (Оқуға кеш жоқ)", textKz: "Оқуға кеш жоқ.", category: "proverb" },

    // Аффирмации
    { textRu: "Я принимаю себя таким, какой я есть.", textKz: "Мен өзімді қандай болсам, солай қабылдаймын.", category: "affirmation" },
    { textRu: "Я достоин любви и уважения.", textKz: "Мен сүйіспеншілік пен құрметке лайықпын.", category: "affirmation" },
    { textRu: "Мои чувства важны и имеют значение.", textKz: "Менің сезімдерім маңызды және мәнді.", category: "affirmation" },
    { textRu: "Я учусь на своих ошибках и становлюсь сильнее.", textKz: "Мен қателіктерімнен үйреніп, күшейемін.", category: "affirmation" },
    { textRu: "Я могу справиться с трудностями.", textKz: "Мен қиындықтарды жеңе аламын.", category: "affirmation" },
    { textRu: "Каждый день я делаю всё, что в моих силах.", textKz: "Күн сайын мен қолымнан келгеннің бәрін жасаймын.", category: "affirmation" },
    { textRu: "Я окружён людьми, которые меня любят.", textKz: "Мені сүйетін адамдар маңымда.", category: "affirmation" },
    { textRu: "Я расту и меняюсь к лучшему.", textKz: "Мен өсемін және жақсы жаққа өзгеремін.", category: "affirmation" },
    { textRu: "Мне не нужно быть идеальным. Мне нужно быть собой.", textKz: "Маған мінсіз болудың керегі жоқ. Маған өзім болу керек.", category: "affirmation" },
    { textRu: "Я имею право на отдых и заботу о себе.", textKz: "Менің демалуға және өзіме қамқорлық жасауға құқығым бар.", category: "affirmation" },
  ];

  for (const q of quotes) {
    await db.insert(contentQuotes).values(q).onConflictDoNothing();
  }
  console.log(`  ✓ ${quotes.length} quotes (motivation + proverbs + affirmations)`);

  console.log("\n✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
