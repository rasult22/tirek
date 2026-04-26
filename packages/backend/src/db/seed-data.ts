import { v4 as uuidv4 } from "uuid";
import { db } from "./index.js";
import {
  diagnosticTests,
  exercises,
  contentQuotes,
  achievements,
} from "./schema.js";
import { testDefinitions } from "../../../shared/src/constants/test-definitions.js";

// ── Diagnostic tests ──────────────────────────────────────────────────
export async function seedDiagnosticTests() {
  for (const [, def] of Object.entries(testDefinitions)) {
    const optionValues = def.options.map((o: { value: number }) => o.value);
    const scoringData = {
      options: def.options,
      thresholds: def.scoringRules,
      reverseItems: def.reverseItems,
      maxScore: def.maxScore,
      maxOptionValue: Math.max(...optionValues),
      minOptionValue: Math.min(...optionValues),
      flaggedRules: ("flaggedRules" in def ? def.flaggedRules : []) ?? [],
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
}

// ── Exercises (breathing + grounding + relaxation + CBT) ──────────────
export async function seedExercises() {
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
    {
      id: uuidv4(),
      type: "cbt",
      slug: "thought-diary",
      nameRu: "Дневник мыслей",
      nameKz: "Ой күнделігі",
      description: "Ситуация → Мысль → Эмоция → Искажение → Альтернатива",
      config: { cbtType: "thought_diary" },
    },
    {
      id: uuidv4(),
      type: "relaxation",
      slug: "body-scan",
      nameRu: "Сканирование тела",
      nameKz: "Дене сканерлеу",
      description: "Последовательное расслабление от головы до стоп",
      config: {
        steps: [
          { nameRu: "Макушка головы", nameKz: "Бас төбесі", durationSec: 15 },
          { nameRu: "Лоб и виски", nameKz: "Маңдай және самай", durationSec: 15 },
          { nameRu: "Глаза и нос", nameKz: "Көз және мұрын", durationSec: 15 },
          { nameRu: "Челюсть и рот", nameKz: "Жақ және ауыз", durationSec: 15 },
          { nameRu: "Шея", nameKz: "Мойын", durationSec: 15 },
          { nameRu: "Плечи", nameKz: "Иық", durationSec: 20 },
          { nameRu: "Руки и кисти", nameKz: "Қол және алақан", durationSec: 20 },
          { nameRu: "Грудь", nameKz: "Кеуде", durationSec: 20 },
          { nameRu: "Живот", nameKz: "Іш", durationSec: 20 },
          { nameRu: "Спина", nameKz: "Арқа", durationSec: 20 },
          { nameRu: "Бёдра и колени", nameKz: "Сан және тізе", durationSec: 15 },
          { nameRu: "Голени и стопы", nameKz: "Балтыр және табан", durationSec: 15 },
        ],
      },
    },
    {
      id: uuidv4(),
      type: "grounding",
      slug: "safe-place",
      nameRu: "Безопасное место",
      nameKz: "Қауіпсіз орын",
      description: "Визуализация безопасного, спокойного места",
      config: {
        steps: [
          { promptRu: "Как выглядит твоё безопасное место? Опиши, что ты видишь вокруг.", promptKz: "Сенің қауіпсіз орның қандай? Айналаңда не көресің?", icon: "eye-outline", placeholderRu: "Я вижу...", placeholderKz: "Мен көремін..." },
          { promptRu: "Какие звуки ты слышишь в этом месте?", promptKz: "Бұл жерде қандай дыбыстар естисің?", icon: "ear-outline", placeholderRu: "Я слышу...", placeholderKz: "Мен естімін..." },
          { promptRu: "Что ты чувствуешь кожей? Тепло, прохладу, ветер?", promptKz: "Теріңмен не сезесің? Жылулық, салқындық, жел?", icon: "hand-left-outline", placeholderRu: "Я чувствую...", placeholderKz: "Мен сеземін..." },
          { promptRu: "Какие запахи в этом месте?", promptKz: "Бұл жерде қандай иістер бар?", icon: "flower-outline", placeholderRu: "Здесь пахнет...", placeholderKz: "Мұнда иісі...", },
          { promptRu: "Какие эмоции ты испытываешь здесь? Что чувствует твоё тело?", promptKz: "Мұнда қандай эмоцияларды сезінесің? Денең не сезеді?", icon: "heart-outline", placeholderRu: "Я чувствую себя...", placeholderKz: "Мен өзімді сеземін..." },
        ],
      },
    },
    {
      id: uuidv4(),
      type: "journaling",
      slug: "joy-jar",
      nameRu: "Баночка радости",
      nameKz: "Қуаныш құмырасы",
      description: "Записывай хорошие моменты каждый день",
      config: { cbtType: "joy_jar" },
    },
    {
      id: uuidv4(),
      type: "art_therapy",
      slug: "body-emotion-map",
      nameRu: "Карта эмоций тела",
      nameKz: "Дене эмоция картасы",
      description: "Отметь, где в теле ты чувствуешь эмоции",
      config: { cbtType: "body_emotion_map" },
    },
  ];

  for (const ex of exerciseData) {
    await db.insert(exercises).values(ex).onConflictDoNothing();
  }
  console.log("  ✓ 10 exercises (3 breathing + 2 grounding + 2 relaxation + 1 CBT + 1 journaling + 1 art_therapy)");
}

// ── Motivational quotes / proverbs / affirmations ─────────────────────
export async function seedQuotes() {
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

    // Вдохновляющие истории
    { textRu: "Айгуль боялась выступать перед классом. Каждый раз, когда нужно было ответить у доски, у неё дрожал голос. Но она начала практиковать дыхательные упражнения перед каждым выступлением. Через месяц она выступила на школьной конференции — и зал ей аплодировал.", textKz: "Айгүл сыныптың алдында сөйлеуден қорқатын. Тақтаға шыққан сайын дауысы дірілдейтін. Бірақ ол әр сөйлеу алдында тыныс алу жаттығуларын жасай бастады. Бір ай өткенде ол мектеп конференциясында сөйлеп, зал қол шапалақтады.", category: "story" },
    { textRu: "Арман чувствовал себя одиноким после перехода в новую школу. Никто с ним не разговаривал. Он начал записывать в дневник по три хорошие вещи каждый день. Постепенно он стал замечать добрые жесты одноклассников и смог заговорить первым. К концу четверти у него появились настоящие друзья.", textKz: "Арман жаңа мектепке ауысқаннан кейін жалғыздық сезінді. Онымен ешкім сөйлеспеді. Ол күн сайын күнделікке үш жақсы нәрсе жаза бастады. Бірте-бірте сыныптастарының мейірімді қимылдарын байқап, бірінші болып сөйлесе бастады. Тоқсан соңында оның шынайы достары пайда болды.", category: "story" },
    { textRu: "Дана не могла заснуть перед экзаменами — тревога не отпускала. Школьный психолог научил её технике «безопасное место». Каждый вечер перед сном она представляла бабушкин сад с яблонями. Тревога отступала, и Дана засыпала спокойно. Экзамены она сдала лучше, чем ожидала.", textKz: "Дана емтихан алдында ұйықтай алмады — алаңдаушылық қоймады. Мектеп психологы оған «қауіпсіз орын» техникасын үйретті. Ұйықтар алдында ол әжесінің алма бағын елестетті. Алаңдаушылық тарап, Дана тыныш ұйықтады. Емтихандарды ол күткеннен жақсырақ тапсырды.", category: "story" },
    { textRu: "Тимура обижали старшеклассники — забирали деньги на обед. Он долго молчал, потому что стыдился. Когда он наконец рассказал школьному психологу, вместе они нашли безопасный выход. Тимур понял: просить помощи — не слабость, а смелость.", textKz: "Тимурды аға сынып оқушылары ренжітетін — түскі асқа ақшасын алып қоятын. Ол ұялғандықтан ұзақ үндемеді. Ақырында мектеп психологына айтқанда, бірге қауіпсіз шешім тапты. Тимур түсінді: көмек сұрау — әлсіздік емес, батылдық.", category: "story" },
    { textRu: "Камила думала, что с ней что-то не так, потому что ей бывает грустно без причины. На уроке психологии она узнала, что перепады настроения — нормальная часть взросления. Она стала отмечать своё настроение каждый день и заметила закономерности. Это помогло ей лучше понять себя.", textKz: "Камила себепсіз қайғырғаны үшін өзінде бірдеңе дұрыс емес деп ойлады. Психология сабағында көңіл-күй өзгерістері — есею кезеңінің қалыпты бөлігі екенін білді. Ол күн сайын көңіл-күйін белгілеп, заңдылықтарды байқады. Бұл оған өзін жақсырақ түсінуге көмектесті.", category: "story" },
    { textRu: "Ержан занимался спортом, но получил травму и больше не мог играть в футбол. Он чувствовал, что потерял всё. Постепенно, делая упражнения на релаксацию и ведя дневник мыслей, он нашёл новые увлечения — рисование и программирование. Он понял, что мы — больше, чем одно увлечение.", textKz: "Ержан спортпен айналысты, бірақ жарақат алып, футбол ойнай алмады. Ол бәрін жоғалтқандай сезінді. Босаңсу жаттығуларын жасап, ой күнделігін жүргізе отырып, жаңа қызығушылықтар тапты — сурет салу мен бағдарламалау. Ол біз бір ғана қызығушылықтан артық екенін түсінді.", category: "story" },
  ];

  for (const q of quotes) {
    await db.insert(contentQuotes).values(q).onConflictDoNothing();
  }
  console.log(`  ✓ ${quotes.length} quotes (motivation + proverbs + affirmations + stories)`);
}

// ── Achievements ──────────────────────────────────────────────────────
export async function seedAchievements() {
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
}
