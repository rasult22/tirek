import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TableRow, TableCell,
  Table, WidthType, ShadingType, convertInchesToTwip,
  PageBreak
} from "docx";
import fs from "fs";

const BLUE = "1A73E8";
const DARK = "333333";
const GRAY = "666666";
const LIGHT_BG = "F0F4FF";
const WHITE = "FFFFFF";

const heading1 = (text) => new Paragraph({
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Calibri" })],
});

const heading2 = (text) => new Paragraph({
  spacing: { before: 300, after: 150 },
  children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: "Calibri" })],
});

const heading3 = (text) => new Paragraph({
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, size: 22, color: DARK, font: "Calibri" })],
});

const para = (text, opts = {}) => new Paragraph({
  spacing: { after: 120 },
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  children: [new TextRun({ text, size: 22, color: opts.color || DARK, font: "Calibri", bold: opts.bold, italics: opts.italic })],
});

const bullet = (text, level = 0) => new Paragraph({
  spacing: { after: 80 },
  bullet: { level },
  children: [new TextRun({ text, size: 22, color: DARK, font: "Calibri" })],
});

const bulletBold = (title, desc) => new Paragraph({
  spacing: { after: 80 },
  bullet: { level: 0 },
  children: [
    new TextRun({ text: title + " ", bold: true, size: 22, color: DARK, font: "Calibri" }),
    new TextRun({ text: desc, size: 22, color: GRAY, font: "Calibri" }),
  ],
});

const emptyLine = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const makeCell = (text, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: 20, color: opts.color || DARK, font: "Calibri" })],
  })],
});

const doc = new Document({
  creator: "Tirek Team",
  title: "Тірек — Концепция платформы психологической поддержки",
  description: "Описание концепции проекта Тірек для презентации",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } },
      },
      children: [
        // ===== TITLE PAGE =====
        emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "ТІРЕК", bold: true, size: 72, color: BLUE, font: "Calibri" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Цифровая платформа психологической поддержки", size: 28, color: GRAY, font: "Calibri" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "для школьников Казахстана", size: 28, color: GRAY, font: "Calibri" })],
        }),
        emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "Концепция проекта", size: 24, color: DARK, font: "Calibri", bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Апрель 2026", size: 22, color: GRAY, font: "Calibri" })],
        }),

        // ===== PAGE BREAK =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. ПРОБЛЕМА =====
        heading1("1. Проблема"),
        para("Психологическое здоровье подростков в Казахстане — критически недооценённая проблема:"),
        emptyLine(),

        bulletBold("Перегрузка психологов:", "один школьный психолог обслуживает 500–1000 учащихся, что делает индивидуальную работу физически невозможной."),
        bulletBold("Барьер обращения:", "подростки стесняются обращаться к психологу напрямую из-за страха стигматизации и непонимания со стороны сверстников."),
        bulletBold("Отсутствие мониторинга:", "нет системного отслеживания эмоционального состояния учащихся; кризисные ситуации обнаруживаются слишком поздно."),
        bulletBold("Нет цифровых решений:", "отсутствуют мобильные платформы на русском и казахском языках, адаптированные для школ Казахстана."),
        bulletBold("Изоляция родителей:", "родители не вовлечены в процесс психологической поддержки и не имеют инструментов для мониторинга."),

        emptyLine(),

        // ===== 2. РЕШЕНИЕ =====
        heading1("2. Решение — Платформа Тірек"),
        para("Тірек (казахское «опора, поддержка») — это доступная, безопасная и дружелюбная цифровая платформа, объединяющая учащихся и школьных психологов в единую экосистему поддержки."),
        emptyLine(),

        heading2("Ключевая идея"),
        para("AI-помощник «Тірек» выступает в роли друга-ровесника, который всегда рядом: выслушает, поддержит, поможет разобраться в эмоциях — и при необходимости незаметно для ученика передаст сигнал психологу."),
        emptyLine(),

        heading2("Целевая аудитория"),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                makeCell("Аудитория", { bold: true, shading: BLUE, color: WHITE, width: 30 }),
                makeCell("Описание", { bold: true, shading: BLUE, color: WHITE, width: 70 }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Учащиеся 5–11 классов", { shading: LIGHT_BG }),
                makeCell("Возраст 10–18 лет. Основные пользователи мобильного приложения.", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Школьные психологи"),
                makeCell("Используют веб-панель для мониторинга, диагностики и коммуникации."),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Родители (перспектива)", { shading: LIGHT_BG }),
                makeCell("Будущий модуль: уведомления, рекомендации, совместный мониторинг.", { shading: LIGHT_BG }),
              ],
            }),
          ],
        }),

        emptyLine(),

        // ===== 3. ФУНКЦИОНАЛЬНОСТЬ =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1("3. Функциональность платформы"),

        heading2("3.1. Мобильное приложение ученика"),
        emptyLine(),

        heading3("Ежедневный мониторинг настроения"),
        bullet("Ежедневный чек-ин: 5 уровней настроения с эмодзи"),
        bullet("Дополнительные параметры: энергия, качество сна, уровень стресса"),
        bullet("Факторы влияния: школа, друзья, семья, здоровье, соцсети"),
        bullet("Календарь настроения (тепловая карта) и анализ трендов"),
        emptyLine(),

        heading3("AI-помощник «Тірек»"),
        bullet("Персональный чат-друг с тёплым, поддерживающим тоном"),
        bullet("Режимы: свободный разговор, решение проблем (тревога, буллинг, конфликты), подготовка к экзаменам"),
        bullet("Полная двуязычность: русский и казахский с контекстным переключением"),
        bullet("Скрытое обнаружение кризисов — автоматическое уведомление психолога"),
        bullet("Потоковая передача ответов в реальном времени (SSE)"),
        emptyLine(),

        heading3("Психологические тесты (9 валидированных методик)"),
        bullet("PHQ-A — подростковая депрессия (9 вопросов)"),
        bullet("GAD-7 — генерализованная тревожность (7 вопросов)"),
        bullet("SCARED — детские тревожные расстройства (41 вопрос)"),
        bullet("Спилбергер-Ханин — ситуативная и личностная тревожность (40 вопросов)"),
        bullet("Шкала Розенберга — самооценка (10 вопросов)"),
        bullet("PSS-10 — воспринимаемый стресс (10 вопросов)"),
        bullet("Опросник буллинга (20 вопросов)"),
        bullet("Шкала академического выгорания (16 вопросов)"),
        bullet("Социометрия — социальные связи (12 вопросов)"),
        emptyLine(),

        heading3("Упражнения для самопомощи"),
        bullet("Дыхательные техники: квадратное дыхание, 4-7-8, диафрагмальное (с анимацией)"),
        bullet("Заземление: техника 5-4-3-2-1, визуализация безопасного места"),
        bullet("Прогрессивная мышечная релаксация (пошаговая)"),
        bullet("CBT-упражнения: дневник мыслей, круг контроля, техника СТОП, поведенческие эксперименты"),
        bullet("Журнал: структурированные подсказки («Сегодня я чувствую...», «3 хороших вещи»)"),
        emptyLine(),

        heading3("Прямой чат с психологом"),
        bullet("Личные сообщения с назначенным школьным психологом"),
        bullet("История переписки и статус прочтения"),
        bullet("Быстрый доступ с главного экрана"),
        emptyLine(),

        heading3("Запись на приём"),
        bullet("Просмотр доступных слотов психолога"),
        bullet("Онлайн-бронирование удобного времени"),
        bullet("Отслеживание статуса записи"),
        emptyLine(),

        heading3("Кризисная поддержка (SOS)"),
        bullet("Кнопка SOS — доступна с любого экрана приложения"),
        bullet("3 уровня эскалации: поддержка → уведомление психолога → экстренные контакты"),
        bullet("Казахстанские горячие линии: 150, 111, 112"),
        bullet("Интегрированное обнаружение кризисов через AI"),
        emptyLine(),

        heading3("Геймификация"),
        bullet("Виртуальное растение: растёт от активности (росток → куст → дерево → цветущее дерево)"),
        bullet("Серии (streak): ежедневная активность с возможностью «заморозки»"),
        bullet("16 достижений в 4 категориях (без конкуренции и рейтингов)"),
        emptyLine(),

        heading3("Тёмная тема и локализация"),
        bullet("Полная тёмная тема с тёплой палитрой"),
        bullet("Полная поддержка русского и казахского языков (500+ строк UI, 139+ вопросов тестов)"),

        // ===== 3.2 PSYCHOLOGIST APP =====
        new Paragraph({ children: [new PageBreak()] }),
        heading2("3.2. Веб-панель психолога"),
        emptyLine(),

        heading3("Управление учениками"),
        bullet("Список всех учеников с индикаторами статуса (норма / внимание / кризис)"),
        bullet("Карточка ученика: настроение, тесты, заметки, достижения, CBT-записи"),
        bullet("Личные клинические заметки (приватные)"),
        emptyLine(),

        heading3("Кризисный мониторинг"),
        bullet("Мониторинг SOS-событий в реальном времени"),
        bullet("Флаги из AI-чата (выявленные риски)"),
        bullet("Управление инцидентами: детали, уровень серьёзности, решение"),
        emptyLine(),

        heading3("Диагностика"),
        bullet("Назначение тестов отдельным ученикам или целым классам"),
        bullet("Отслеживание выполнения и просмотр результатов"),
        bullet("Детальный скоринг с интерпретацией"),
        emptyLine(),

        heading3("Прямой чат с учениками"),
        bullet("Личные сообщения 1:1 с учениками"),
        bullet("История переписки и бейджи непрочитанных"),
        emptyLine(),

        heading3("Управление приёмами"),
        bullet("Создание еженедельных слотов для записи"),
        bullet("Подтверждение, отмена, завершение записей"),
        bullet("Добавление заметок к встречам"),
        emptyLine(),

        heading3("Аналитика и отчёты"),
        bullet("Отчёты по классам: активность, настроение, кризисы, тесты"),
        bullet("Экспорт данных в CSV/Excel"),
        bullet("Фильтрация по параллели и букве класса"),
        emptyLine(),

        heading3("Инвайт-коды"),
        bullet("Генерация уникальных кодов для регистрации учеников"),
        bullet("Управление сроком действия и отслеживание использования"),

        // ===== 4. AI ARCHITECTURE =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1("4. AI-архитектура"),
        emptyLine(),

        para("В основе платформы лежит AI-агент на базе GPT-4.1-Mini, интегрированный через фреймворк Mastra:"),
        emptyLine(),

        heading3("Персонаж и тон"),
        bullet("Имя: «Тірек» — друг-ровесник, не бот и не психолог"),
        bullet("Эмоциональный, поддерживающий стиль общения"),
        bullet("Использует подростковую лексику и эмодзи (без злоупотребления)"),
        bullet("Никогда не упоминает, что является ИИ"),
        emptyLine(),

        heading3("Память и персонализация"),
        bullet("Хранение памяти в PostgreSQL (до 40 последних сообщений)"),
        bullet("Рабочая память: профиль ученика, эмоциональное состояние, ключевые темы"),
        bullet("Контекст сессии для персонализированного взаимодействия"),
        emptyLine(),

        heading3("Инструменты AI-агента"),
        bulletBold("Обнаружение кризисов:", "анализ контекста и смысла (не только ключевых слов) для выявления рисков суицида, самоповреждения, насилия. 3 уровня серьёзности."),
        bulletBold("Уведомление психолога:", "ПОЛНОСТЬЮ незаметная для ученика отправка сигнала. Категории: буллинг, семейные проблемы, социальная изоляция, суицидальные мысли и др."),
        bulletBold("Анализ настроения:", "контекстуальное понимание эмоционального состояния из переписки."),
        emptyLine(),

        heading3("Безопасность AI"),
        bullet("Обязательная проверка кризиса при любых сигналах бедствия"),
        bullet("Автоматическая эскалация при среднем и высоком уровне риска"),
        bullet("Запрет на диагностику, рекомендацию лекарств, обсуждение интимного контента"),
        bullet("Прозрачность: ученик знает при онбординге, что критическая информация будет передана"),

        // ===== 5. БЕЗОПАСНОСТЬ =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1("5. Безопасность и конфиденциальность"),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                makeCell("Аспект", { bold: true, shading: BLUE, color: WHITE, width: 35 }),
                makeCell("Реализация", { bold: true, shading: BLUE, color: WHITE, width: 65 }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Регистрация", { shading: LIGHT_BG }),
                makeCell("Только по инвайт-коду от психолога (нет свободной регистрации)", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Согласие родителей"),
                makeCell("Обязательно для учеников до 14 лет, рекомендовано для 14–18 лет"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Аутентификация", { shading: LIGHT_BG }),
                makeCell("JWT-токены + bcrypt хеширование паролей", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Конфиденциальность"),
                makeCell("Ученик информирован при онбординге о пределах конфиденциальности (угроза жизни)"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Кризисные данные", { shading: LIGHT_BG }),
                makeCell("Только точечная маркировка отдельных сообщений, не тотальная слежка", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Заметки психолога"),
                makeCell("Приватные — доступны только автору, не видны ученикам"),
              ],
            }),
          ],
        }),

        // ===== 6. ТЕХНОЛОГИИ =====
        emptyLine(),
        heading1("6. Технологический стек"),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                makeCell("Компонент", { bold: true, shading: BLUE, color: WHITE, width: 30 }),
                makeCell("Технология", { bold: true, shading: BLUE, color: WHITE, width: 70 }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Серверная часть (API)", { shading: LIGHT_BG }),
                makeCell("Node.js, Hono, TypeScript", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("База данных"),
                makeCell("PostgreSQL + Drizzle ORM (25+ таблиц)"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("AI-движок", { shading: LIGHT_BG }),
                makeCell("Mastra Framework + OpenAI GPT-4.1-Mini", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Мобильное приложение"),
                makeCell("React 19 + Vite 6 + Tailwind CSS 4 (mobile-first web app)"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Панель психолога", { shading: LIGHT_BG }),
                makeCell("React 19 + Vite 6 + Tailwind CSS 4 (веб-панель)", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Общий код"),
                makeCell("Shared-пакет: типы, валидаторы, i18n, константы"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Реальное время", { shading: LIGHT_BG }),
                makeCell("Server-Sent Events (SSE) для потокового AI-чата", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Инфраструктура"),
                makeCell("Docker Compose, монорепо с npm workspaces"),
              ],
            }),
          ],
        }),

        // ===== 7. ARCHITECTURE =====
        emptyLine(),
        heading1("7. Архитектура платформы"),
        emptyLine(),

        para("Платформа построена как монорепозиторий с 4 пакетами:"),
        emptyLine(),

        bullet("Backend (API) — единый REST API с документацией Swagger"),
        bullet("Student App — мобильное веб-приложение для учеников (29 экранов)"),
        bullet("Psychologist App — веб-панель для психологов (15 экранов)"),
        bullet("Shared — общие типы, валидации, интернационализация"),
        emptyLine(),

        para("Все приложения взаимодействуют через единый API. AI-агент интегрирован на бэкенде и имеет доступ к инструментам: обнаружение кризисов, уведомление психолога, анализ настроения."),

        // ===== 8. КОНКУРЕНТНЫЕ ПРЕИМУЩЕСТВА =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1("8. Конкурентные преимущества"),
        emptyLine(),

        bulletBold("AI-друг, а не чат-бот —", "«Тірек» разговаривает как ровесник, а не как программа. Ученик чувствует поддержку, а не допрос."),
        bulletBold("Скрытое обнаружение кризисов —", "AI анализирует контекст сообщений и незаметно уведомляет психолога о рисках. Ученик не знает о передаче сигнала."),
        bulletBold("9 валидированных методик —", "научно обоснованные тесты (PHQ-A, GAD-7, SCARED и др.), а не общие опросники «настроения»."),
        bulletBold("Полная двуязычность —", "русский и казахский языки в интерфейсе, тестах и AI-чате — критично для рынка Казахстана."),
        bulletBold("Геймификация без вреда —", "виртуальное растение «засыпает» при неактивности (не умирает), нет рейтингов и конкуренции."),
        bulletBold("Комплексный инструментарий —", "дыхательные техники, CBT-упражнения, заземление, журнал, тесты — всё в одном приложении."),
        bulletBold("Psychologist-in-the-loop —", "AI не заменяет психолога, а усиливает его. Психолог видит всю картину: настроение, тесты, чат, кризисы."),
        bulletBold("Культурная адаптация —", "казахстанские горячие линии, школьная система (5–11 классы), казахские пословицы и контекст."),
        bulletBold("Privacy-first —", "только инвайт-регистрация, согласие родителей, прозрачные пределы конфиденциальности."),

        // ===== 9. МЕТРИКИ =====
        emptyLine(),
        heading1("9. Текущий статус разработки"),
        emptyLine(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                makeCell("Метрика", { bold: true, shading: BLUE, color: WHITE, width: 40 }),
                makeCell("Значение", { bold: true, shading: BLUE, color: WHITE, width: 60 }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Экраны приложения ученика", { shading: LIGHT_BG }),
                makeCell("29 страниц", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Экраны панели психолога"),
                makeCell("15 страниц"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("API-эндпоинты", { shading: LIGHT_BG }),
                makeCell("30+ маршрутов с Swagger-документацией", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Таблицы в БД"),
                makeCell("25+ таблиц (PostgreSQL)"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Диагностические тесты", { shading: LIGHT_BG }),
                makeCell("9 валидированных методик, 165+ вопросов", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Достижения"),
                makeCell("16 бейджей в 4 категориях"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Упражнения", { shading: LIGHT_BG }),
                makeCell("9 типов (дыхание, заземление, PMR, CBT)", { shading: LIGHT_BG }),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Языки"),
                makeCell("Русский + Казахский (500+ строк UI)"),
              ],
            }),
            new TableRow({
              children: [
                makeCell("Фаза разработки", { shading: LIGHT_BG }),
                makeCell("MVP (P0 + P1 завершены, P2 в процессе)", { shading: LIGHT_BG }),
              ],
            }),
          ],
        }),

        // ===== 10. ПЕРСПЕКТИВЫ =====
        emptyLine(),
        heading1("10. Перспективы развития"),
        emptyLine(),

        bullet("Административная панель — управление школами, психологами и контентом"),
        bullet("Модуль для родителей — уведомления, рекомендации, совместный мониторинг"),
        bullet("Персональные планы безопасности — индивидуальные антикризисные стратегии"),
        bullet("Назначение упражнений — психолог назначает конкретные упражнения ученику"),
        bullet("Мотивационный контент — истории, аффирмации, карточки поддержки"),
        bullet("Интеграция с образовательными системами — Kundelik, электронный дневник"),
        bullet("Мобильное нативное приложение — iOS и Android через React Native"),
        bullet("Масштабирование — адаптация для других стран Центральной Азии"),

        // ===== CLOSING =====
        emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Тірек — опора для каждого ученика", bold: true, size: 28, color: BLUE, font: "Calibri", italics: true })],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("Tirek_Concept.docx", buffer);
console.log("Document created: Tirek_Concept.docx");
