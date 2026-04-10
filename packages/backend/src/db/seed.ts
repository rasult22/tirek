import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { users, inviteCodes, diagnosticTests, exercises, contentQuotes, studentPsychologist, achievements } from "./schema.js";
import { testDefinitions } from "../../../shared/src/constants/test-definitions.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── 1. Demo psychologist ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo123456", 10);

  // Check if psychologist already exists
  const [existingPsych] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "psychologist@tirek.kz"))
    .limit(1);

  let psychologistId: string;
  if (existingPsych) {
    psychologistId = existingPsych.id;
  } else {
    psychologistId = uuidv4();
    await db.insert(users).values({
      id: psychologistId,
      email: "psychologist@tirek.kz",
      passwordHash,
      name: "Айгуль Нурланова",
      role: "psychologist",
      language: "ru",
    });
  }

  console.log("  ✓ Demo psychologist: psychologist@tirek.kz / demo123456");

  // ── 1b. Demo student + invite code ─────────────────────────────────
  await db
    .insert(inviteCodes)
    .values({
      id: uuidv4(),
      code: "TEST-0001",
      psychologistId,
      grade: 9,
      classLetter: "А",
    })
    .onConflictDoNothing();

  const [existingStudent] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "student@tirek.kz"))
    .limit(1);

  let studentId: string;
  if (existingStudent) {
    studentId = existingStudent.id;
  } else {
    studentId = uuidv4();
    await db.insert(users).values({
      id: studentId,
      email: "student@tirek.kz",
      passwordHash,
      name: "Алия Сериков",
      role: "student",
      language: "ru",
      avatarId: "avatar-1",
      grade: 9,
      classLetter: "А",
    });
  }

  // Link student to psychologist
  await db
    .insert(studentPsychologist)
    .values({ studentId, psychologistId })
    .onConflictDoNothing();

  console.log("  ✓ Demo student: student@tirek.kz / demo123456");

  // ── 2. Diagnostic tests ─────────────────────────────────────────────
  for (const [slug, def] of Object.entries(testDefinitions)) {
    const optionValues = def.options.map((o: { value: number }) => o.value);
    const scoringData = {
      options: def.options,
      thresholds: def.scoringRules,
      reverseItems: def.reverseItems,
      maxScore: def.maxScore,
      maxOptionValue: Math.max(...optionValues),
      minOptionValue: Math.min(...optionValues),
    };
    await db
      .insert(diagnosticTests)
      .values({
        id: uuidv4(),
        slug: def.slug,
        nameRu: def.nameRu,
        nameKz: def.nameKz,
        description: def.descriptionRu,
        questions: def.questions,
        scoringRules: scoringData,
        questionCount: def.questions.length,
      })
      .onConflictDoUpdate({
        target: diagnosticTests.slug,
        set: {
          nameRu: def.nameRu,
          nameKz: def.nameKz,
          description: def.descriptionRu,
          questions: def.questions,
          scoringRules: scoringData,
          questionCount: def.questions.length,
        },
      });
  }
  console.log(`  ✓ ${Object.keys(testDefinitions).length} diagnostic tests seeded`);

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
    {
      id: uuidv4(),
      type: "grounding",
      slug: "grounding-54321",
      nameRu: "Заземление 5-4-3-2-1",
      nameKz: "5-4-3-2-1 жерлеу техникасы",
      description: "Техника заземления через 5 чувств",
      config: {
        steps: [
          { count: 5, senseRu: "вещей, которые ты видишь", senseKz: "көретін заттар", icon: "eye" },
          { count: 4, senseRu: "звука, которые ты слышишь", senseKz: "еститін дыбыстар", icon: "ear" },
          { count: 3, senseRu: "ощущения (прикосновение)", senseKz: "сезетін нәрселер", icon: "hand" },
          { count: 2, senseRu: "запаха", senseKz: "иістер", icon: "flower" },
          { count: 1, senseRu: "вкус", senseKz: "дәм", icon: "apple" },
        ],
      },
    },
    {
      id: uuidv4(),
      type: "relaxation",
      slug: "pmr",
      nameRu: "Мышечная релаксация",
      nameKz: "Бұлшықет релаксациясы",
      description: "Напряжение → удержание → расслабление мышц",
      config: {
        steps: [
          { muscleGroupRu: "Кисти рук", muscleGroupKz: "Қол ұшы", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Предплечья", muscleGroupKz: "Білек", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Плечи", muscleGroupKz: "Иық", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Лицо", muscleGroupKz: "Бет", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Шея", muscleGroupKz: "Мойын", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Живот", muscleGroupKz: "Іш", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Бёдра", muscleGroupKz: "Сан", tensionSec: 5, holdSec: 5, releaseSec: 10 },
          { muscleGroupRu: "Стопы", muscleGroupKz: "Табан", tensionSec: 5, holdSec: 5, releaseSec: 10 },
        ],
      },
    },
  ];

  // CBT exercises
  exerciseData.push(
    {
      id: uuidv4(),
      type: "cbt",
      slug: "thought-diary",
      nameRu: "Дневник мыслей",
      nameKz: "Ой күнделігі",
      description: "Ситуация → Мысль → Эмоция → Искажение → Альтернатива",
      config: { cbtType: "thought_diary" },
    },
  );

  for (const ex of exerciseData) {
    await db.insert(exercises).values(ex).onConflictDoNothing();
  }
  console.log("  ✓ 6 exercises (3 breathing + 1 grounding + 1 relaxation + 1 CBT)");

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

  // ── 5. Achievements ────────────────────────────────────────────────
  const achievementData = [
    // First steps
    { id: uuidv4(), slug: "first-mood", category: "first_steps", nameRu: "Первое настроение", nameKz: "Алғашқы көңіл-күй", descriptionRu: "Отметить настроение впервые", descriptionKz: "Алғаш рет көңіл-күйді белгілеу", emoji: "🎯", sortOrder: 1 },
    { id: uuidv4(), slug: "first-exercise", category: "first_steps", nameRu: "Первая медитация", nameKz: "Алғашқы медитация", descriptionRu: "Выполнить первое упражнение", descriptionKz: "Алғашқы жаттығуды орындау", emoji: "🌬️", sortOrder: 2 },
    { id: uuidv4(), slug: "first-journal", category: "first_steps", nameRu: "Первый дневник", nameKz: "Алғашқы күнделік", descriptionRu: "Написать первую запись в дневнике", descriptionKz: "Күнделікке алғашқы жазба жазу", emoji: "📝", sortOrder: 3 },
    { id: uuidv4(), slug: "first-test", category: "first_steps", nameRu: "Первый тест", nameKz: "Алғашқы тест", descriptionRu: "Пройти первый тест", descriptionKz: "Алғашқы тестті тапсыру", emoji: "📋", sortOrder: 4 },
    // Streaks
    { id: uuidv4(), slug: "streak-3", category: "streak", nameRu: "3 дня подряд", nameKz: "3 күн қатарынан", descriptionRu: "Серия из 3 дней активности", descriptionKz: "3 күндік белсенділік сериясы", emoji: "🔥", sortOrder: 10 },
    { id: uuidv4(), slug: "streak-7", category: "streak", nameRu: "7 дней подряд", nameKz: "7 күн қатарынан", descriptionRu: "Серия из 7 дней активности", descriptionKz: "7 күндік белсенділік сериясы", emoji: "🔥", sortOrder: 11 },
    { id: uuidv4(), slug: "streak-30", category: "streak", nameRu: "30 дней подряд", nameKz: "30 күн қатарынан", descriptionRu: "Серия из 30 дней активности", descriptionKz: "30 күндік белсенділік сериясы", emoji: "💎", sortOrder: 12 },
    // Mastery
    { id: uuidv4(), slug: "breathing-master", category: "mastery", nameRu: "Мастер дыхания", nameKz: "Тыныс алу шебері", descriptionRu: "Выполнить 10 дыхательных упражнений", descriptionKz: "10 тыныс алу жаттығуын орындау", emoji: "🌬️", sortOrder: 20 },
    { id: uuidv4(), slug: "exercise-master", category: "mastery", nameRu: "Мастер упражнений", nameKz: "Жаттығу шебері", descriptionRu: "Выполнить 25 упражнений", descriptionKz: "25 жаттығу орындау", emoji: "💪", sortOrder: 21 },
    { id: uuidv4(), slug: "mood-expert", category: "mastery", nameRu: "Эмоциональный эксперт", nameKz: "Эмоция сарапшысы", descriptionRu: "Отметить настроение 30 раз", descriptionKz: "Көңіл-күйді 30 рет белгілеу", emoji: "🧠", sortOrder: 22 },
    { id: uuidv4(), slug: "journal-keeper", category: "mastery", nameRu: "Хранитель дневника", nameKz: "Күнделік сақтаушысы", descriptionRu: "Написать 15 записей в дневнике", descriptionKz: "Күнделікке 15 жазба жазу", emoji: "📖", sortOrder: 23 },
    { id: uuidv4(), slug: "test-explorer", category: "mastery", nameRu: "Исследователь тестов", nameKz: "Тест зерттеушісі", descriptionRu: "Пройти 3 разных теста", descriptionKz: "3 түрлі тест тапсыру", emoji: "🏆", sortOrder: 24 },
    { id: uuidv4(), slug: "all-tests", category: "mastery", nameRu: "Все тесты пройдены", nameKz: "Барлық тесттер тапсырылды", descriptionRu: "Пройти все доступные тесты", descriptionKz: "Барлық қолжетімді тесттерді тапсыру", emoji: "🎓", sortOrder: 25 },
    // Growth
    { id: uuidv4(), slug: "plant-sprout", category: "growth", nameRu: "Росток", nameKz: "Өскін", descriptionRu: "Вырастить растение до 2 стадии", descriptionKz: "Өсімдікті 2-ші сатыға дейін өсіру", emoji: "🌱", sortOrder: 30 },
    { id: uuidv4(), slug: "plant-tree", category: "growth", nameRu: "Дерево", nameKz: "Ағаш", descriptionRu: "Вырастить растение до 3 стадии", descriptionKz: "Өсімдікті 3-ші сатыға дейін өсіру", emoji: "🌳", sortOrder: 31 },
    { id: uuidv4(), slug: "plant-bloom", category: "growth", nameRu: "Цветение", nameKz: "Гүлдеу", descriptionRu: "Вырастить растение до 4 стадии", descriptionKz: "Өсімдікті 4-ші сатыға дейін өсіру", emoji: "🌸", sortOrder: 32 },
  ];

  for (const a of achievementData) {
    await db.insert(achievements).values(a).onConflictDoNothing();
  }
  console.log(`  ✓ ${achievementData.length} achievements (4 categories)`);

  console.log("\n✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
