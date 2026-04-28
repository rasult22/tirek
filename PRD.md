# Tirek — Product Requirements Document

> Версия: 1.0 (2026-04-24)
> Статус: активный
> Термины доменного языка см. `UBIQUITOUS_LANGUAGE.md`
> Контекст и миссия см. `PROJECT.md`

---

## Problem Statement

Школьные психологи Казахстана перегружены (1 специалист на 500–1000 учеников) и не успевают замечать психологические проблемы учащихся до критического момента. Дети 10–18 лет, в свою очередь, часто стесняются обращаться к психологу напрямую, а при кризисных состояниях (суицидальные мысли, насилие, домогательства, буллинг) у них нет канала связи с взрослыми, который не требовал бы преодоления стыда и страха.

Психолог не видит ежедневного психоэмоционального состояния учеников, вынужден работать реактивно ("ученик сам пришёл") вместо проактивного мониторинга, и теряет часы на ручной подсчёт результатов тестов, ведение классных журналов, отслеживание того, кто из учеников давно не появлялся. Ученик, в свою очередь, не имеет инструмента самопомощи "здесь и сейчас" — когда тревожит экзамен, ссора с подругой или конфликт дома.

Система должна работать в двуязычной среде (русский + казахский), соответствовать законодательству РК о персональных данных детей, и быть пригодной к неофициальному пилотному развёртыванию в одной школе силами одного разработчика.

---

## Solution

**Tirek** — двухпользовательская платформа психологического сопровождения школьников, состоящая из мобильного приложения для ученика (**Student**) и веб-панели для психолога (**Psychologist**).

**Для Student'а** Tirek — это приватный инструмент самопомощи и канал экстренной связи. Ученик трекает настроение, общается с AI-Friend'ом (LLM-агентом в роли дружеского собеседника без клинической роли), выполняет упражнения (дыхание, заземление, КПТ, журналирование), проходит тесты, назначенные психологом, а в трудный момент — нажимает одну **SOS Button** с 4 понятными опциями. Геймификация (Streak, Plant, Achievements) поддерживает вовлечённость без принуждения: "Plant засыпает, но не умирает".

**Для Psychologist'а** Tirek — это рабочее место, где одним взглядом видно кто требует реакции сегодня (**Red Feed**), кто нуждается в фоновом внимании (**Yellow Feed**), кто перестал заходить в приложение (**Inactivity Signal**). Психолог назначает тесты, читает **AI Test Report** (интерпретацию на своём языке), ведёт приватные заметки, публикует ежедневно гибкие приёмные часы (**Office Hours**), общается с учениками через **Direct Chat**.

**Ключевой этический принцип:** при критических сигналах (суицид, насилие, домогательства) **AI-Friend** молча уведомляет **Psychologist'а** через **Crisis Signal** даже без согласия Student'а — безопасность важнее доверия. При незначительных проблемах AI-Friend рекомендует ученику самому обратиться к психологу (**Psychologist Redirect**), не снитчит.

**Архитектурный задел:** в Phase 2 добавляется **AI-Copilot** — отдельный агент на стороне Psychologist'а, ведущий **Student Dossier** и выдающий рекомендации через периодический **Copilot Scan**. В MVP не реализован, но модель данных и границы сигналов закладываются с учётом его будущего подключения.

---

## User Stories

### Identity & Access

1. Как **Psychologist**, я хочу зарегистрироваться по email+паролю и указать свою **School**, чтобы начать работу в системе.
2. Как **Psychologist**, я хочу сгенерировать **Invite Code** с **Real Name** будущего ученика и **Class Code** (например, "7А"), чтобы потом передать его конкретному ученику по классному журналу.
3. Как **Psychologist**, я хочу сгенерировать пачку **Invite Code**'ов сразу на весь класс (с вводом ФИО каждого) до 100 штук, чтобы не создавать их по одному.
4. Как **Psychologist**, я хочу видеть список своих **Invite Code**'ов со статусом (active / used / expired) и именем будущего ученика, чтобы понимать, кто из класса ещё не активировал приложение.
5. Как **Psychologist**, я хочу отозвать неиспользованный **Invite Code**, если ошибся в ФИО или ученик выбыл.
6. Как **Student**, я хочу активировать **Invite Code**, указав только email и пароль (без имени — имя уже задано психологом), чтобы войти в приложение.
7. Как **Student**, я хочу при желании задать **Display Name** (локальный ник) в настройках приложения, понимая, что психолог всё равно видит моё **Real Name**.
8. Как **Student**, я хочу, чтобы после активации **Invite Code** я был автоматически связан со своим **Psychologist**'ом.
9. Как **Psychologist** или **Student**, я хочу войти в приложение по email+паролю, чтобы получить доступ к своим данным.
10. Как **Psychologist** или **Student**, я хочу переключить **Interface Language** (ru/kz) в настройках, чтобы UI и ответы AI были на выбранном языке, и эта настройка сохранялась между устройствами (синк с БД, не только localStorage).

### Rhythm & Reflection (Student)

11. Как **Student**, я хочу сделать **Mood Check-in** в любой момент дня, оценив настроение по шкале 1–5 плюс опциональные параметры (энергия, сон, стресс, факторы, короткая заметка), чтобы зафиксировать своё состояние.
12. Как **Student**, я хочу иметь возможность сделать **до двух Mood Check-in'ов** за **Almaty Day**: один в **Day Slot** (до 18:00 по Алматы) и один в **Evening Slot** (после 18:00), чтобы отразить настроение утром/днём и вечерний итог.
13. Как **Student**, я хочу получить **Evening Prompt** (пуш в 20:00 Asia/Almaty), если я ещё не сделал запись в **Evening Slot** сегодня, чтобы не забыть про вечернюю рефлексию.
14. Как **Student**, я хочу видеть календарь настроений за месяц с цветовой кодировкой, чтобы наблюдать свои паттерны.
15. Как **Student**, я хочу видеть инсайты ("среднее за неделю", "тренд улучшается/стабильно/ухудшается", "топ-5 факторов"), чтобы понимать что влияет на моё настроение.
16. Как **Student**, я хочу записать **Journal Entry** (дневник) по промпту ("Сегодня я чувствую…", "Три хороших вещи за день") или без, чтобы проработать мысли через письмо.
17. Как **Student**, я хочу выполнить **Exercise** (дыхание 4-7-8, квадратное дыхание, диафрагмальное, заземление 5-4-3-2-1, ПМР, body scan, safe place, joy jar, body emotion map) с интерактивным гидом, чтобы успокоиться или расслабиться.
18. Как **Student**, я хочу записать **CBT Entry** в одном из 4 инструментов (Thought Diary wizard на 5 шагов, Circle of Control, STOP-техника, Behavioral Experiment), чтобы структурированно проработать мысль или ситуацию.
19. Как **Student**, я хочу видеть историю своих **CBT Entry**'ей и **Journal Entry**'ей и удалять их.
20. Как **Student**, я хочу видеть свой **Streak** (дни подряд с хотя бы одним **Productive Action**) на дашборде, чтобы ощущать прогресс.
21. Как **Student**, я хочу, чтобы мой **Streak** инкрементировался при **любом Productive Action** за день (Mood Check-in, Exercise, Journal Entry, CBT Entry, Test Session, сообщение в AI-Friend Chat), но **не** при общении в **Direct Chat**.
22. Как **Student**, я хочу, чтобы при пропуске дня мой **Plant** "засыпал", но не обнулялся и не умирал, чтобы не чувствовать наказание.
23. Как **Student**, я хочу растить **Plant**, получая очки за **Productive Action** (mood +10, exercise +15, journal +10, cbt +15) и проходя 4 стадии (росток 0–49, кустик 50–149, дерево 150–299, цветущее дерево 300+), с возможностью задать имя растению.
24. Как **Student**, я хочу получать **Achievements** в 4 категориях (первые шаги, серии, мастерство, рост), чтобы отмечать вехи своего пути.

### Diagnostics

25. Как **Psychologist**, я хочу назначить **Test** (PHQ-A, GAD-7, SCARED, STAI, RSES, PSS-10, Буллинг, Выгорание, Социометрия — 9 тестов, 139 билингвальных вопросов) конкретному **Student**'у или целому классу (по **Class Code**) с опциональным дедлайном.
26. Как **Psychologist**, я хочу видеть мониторинг прохождения **Test Assignment**'ов (кто прошёл, кто нет, с цветовой кодировкой).
27. Как **Student**, я хочу видеть **только назначенные** мне тесты в основной ленте диагностики, без раздела "исследовать все тесты".
28. Как **Student**, я хочу видеть историю своих **Test Session**'ов (прошёл / не прошёл, дата), **без баллов и без severity**.
29. Как **Student**, я хочу пройти назначенный **Test** на своём **Interface Language**.
30. Как **Student**, я хочу после прохождения **Test Session** увидеть мягкое **Completion Screen** с благодарностью и кнопками на **Exercise** ("Попробовать дыхание", "Записать в дневник"), **без показа score, severity, категории или интерпретации**.
31. Как **Student**, при критическом результате **Test Session** (severity=high или критические **Flagged Items**) я хочу увидеть **Soft Escalation** — тот же экран, но с дополнительными кнопками "Написать психологу" / "Позвонить 150" / "Подышать", без слов "депрессия" или "тревожность".
32. Как **Psychologist**, я хочу видеть полные результаты **Test Session**'а ученика: score, severity, **Flagged Items**, динамику между сессиями.
33. Как **Psychologist**, я хочу читать **AI Test Report** по каждой сессии (summary, interpretation, riskFactors, recommendations, trend) на **своём Interface Language**, даже если ученик проходил тест на другом языке.
34. Как **Psychologist**, я хочу получить **Crisis Signal** автоматически, когда **Test Session** заканчивается с severity=high или с критическими **Flagged Items**, чтобы не пропустить опасный результат.

### AI-Friend (Student)

35. Как **Student**, я хочу нажать одну кнопку "Поговорить с AI-Friend" и сразу начать писать, без выбора режима сессии, чтобы не тратить силы на "классификацию своей проблемы".
36. Как **Student**, я хочу, чтобы AI-Friend знал моё имя, класс, среднее настроение за 7 дней и факт недавних прохождений тестов, но **не знал моих конкретных score и severity**, чтобы не превращался в квази-врача.
37. Как **Student**, я хочу, чтобы AI-Friend отвечал на моём **Interface Language**.
38. Как **Student**, я хочу, чтобы мои беседы с AI-Friend'ом были **приватны** от психолога в обычных ситуациях, чтобы свободно выговариваться.
39. Как **Student**, я хочу, чтобы AI-Friend, если речь идёт о незначительной проблеме (ссора с подругой, стресс из-за контрольной), **сам предложил** мне написать психологу ("Ты можешь обратиться к [имя психолога], хочешь — открою чат?") с кнопкой **Psychologist Redirect** в **Direct Chat** — **без переноса контекста** разговора.
40. Как **Psychologist**, я хочу, чтобы AI-Friend **тихо** создал **Crisis Signal** и уведомил меня, если Student упоминает суицид, самоповреждение, насилие, домогательства или систематический буллинг — даже без согласия ученика, ради безопасности.
41. Как **Student**, я хочу видеть список своих прошлых **AI-Friend Session**'ов и открывать любую из них.
42. Как **Psychologist**, я хочу, чтобы я **не** видела дословные сообщения ученика из **AI-Friend Chat** — только **Signal Summary** в **Crisis Signal**, написанный агентом, чтобы уважать приватность диалога.

### Crisis & Safety

43. Как **Student**, я хочу видеть **SOS Button** на всех экранах приложения, чтобы в кризисный момент не искать её.
44. Как **Student**, я хочу, нажав **SOS Button**, попасть на **SOS Screen** с **4 понятными опциями**: "Подышать" / "Позвонить на горячую линию 150/111/112" / "Написать психологу" / "Мне срочно плохо" — без выбора "уровня 1/2/3".
45. Как **Student**, я хочу, чтобы опция "Подышать" открывала дыхательное упражнение, опция "Позвонить" давала tel-deeplinks, опция "Написать психологу" открывала **Direct Chat**, а опция "Мне срочно плохо" немедленно уведомляла моего психолога с высшим приоритетом.
46. Как **Psychologist**, я хочу, чтобы **SOS Action** `urgent` создавал **Crisis Signal** в **Red Feed**, а остальные SOS Action'ы фиксировались тихо в истории ученика без сигналов мне.
47. Как **Psychologist**, я хочу видеть **Red Feed** — срочные **Crisis Signal**'ы, требующие реакции сегодня (ручной Urgent Help + AI acute_crisis + критические тесты), одним экраном и одной лентой.
48. Как **Psychologist**, я хочу видеть **Yellow Feed** — фоновые **Crisis Signal**'ы для просмотра в течение недели (AI concern — буллинг / семья / тревожность).
49. Как **Psychologist**, я хочу видеть в **Crisis Signal** имя ученика, класс, **Signal Summary**, время, тип сигнала и быстрые действия ("связаться", "отметить решённым", "открыть профиль ученика") — чтобы оценить и отреагировать за 1–2 секунды.
50. Как **Psychologist**, я хочу резолвить **Crisis Signal**, заполнив отметки о предпринятых действиях ("связалась с учеником", "связалась с родителем", "задокументировала"), чтобы вести историю работы.
51. Как **Psychologist**, я хочу видеть **Inactivity Signal** — виджет "ученики, не заходившие в приложение X дней" — чтобы проактивно подходить к ребёнку и спрашивать лично.

### Communication

52. Как **Student**, я хочу написать **Psychologist**'у в **Direct Chat**, чтобы обсудить что-то с живым человеком.
53. Как **Psychologist**, я хочу видеть список всех моих **Direct Chat**'ов с учениками с badge непрочитанных, и открывать каждый.
54. Как **Student** или **Psychologist**, я хочу видеть обновления в **Direct Chat** близко к real-time (polling ~5 сек на активном чате, 30 сек для unread count).
55. Как **Psychologist**, я хочу получать notification "новое сообщение в Direct Chat" — это часть **Yellow Feed** / `chat` типа уведомлений.

### Psychologist Workspace

56. Как **Psychologist**, я хочу видеть список своих учеников с фильтрами по классу, статусу (норма / требует внимания / кризис), последней активности.
57. Как **Psychologist**, я хочу открыть **Student Profile** с полной картиной: mood-тренды, результаты **Test Session**'ов с динамикой, **Crisis Signal**'ы, уровень активности, **AI Test Report**'ы, история **CBT Entry**'ев ученика, **Achievements**.
58. Как **Psychologist**, я хочу редактировать свои **Office Hours** ежедневно (интервалы по дням, с notes "в кабинете" / "онлайн" / "на семинаре"), чтобы гибко корректировать расписание.
60. Как **Student**, я хочу видеть блок "Когда психолог доступна" ("Сегодня до 17:00 🟢 в кабинете" / "Сегодня недоступна") на экране "Написать психологу", чтобы знать, когда зайти лично, **без бронирования**.
61. Как **Psychologist**, я хочу видеть аналитику класса: средние показатели настроения, распределение по зонам риска, completion rate по тестам, топ-факторы влияния.
62. Как **Psychologist**, я хочу экспортировать отчёт по ученику или классу в PDF или Excel (CSV), чтобы работать с данными оффлайн или предоставлять администрации.
63. Как **Psychologist**, я хочу видеть ленту **Notification**'ов с типами `crisis_red` / `concern_yellow` / `info` / `chat` и переходить к соответствующему объекту одним кликом.

### Content & Motivation

64. Как **Student**, я хочу видеть мотивационные цитаты, казахские пословицы, аффирмации на главном экране и/или в отдельной секции "Вдохновение".

### Darkness & Accessibility

65. Как **Student** или **Psychologist**, я хочу переключать тему (Светлая / Тёмная / Системная) в профиле, чтобы комфортно пользоваться приложением вечером.

### Philosophy — неявные требования

66. Как **Student**, я не хочу, чтобы приложение давило на меня push-уведомлениями типа "Ты пропустил 2 дня! Вернись!" — геймификация должна быть поддерживающей, не принуждающей.
67. Как **Student**, я хочу, чтобы приложение оптимизировалось под мою **пользу в трудный момент**, а не под мой DAU / retention.
68. Как **Psychologist**, я хочу, чтобы каждый экран рабочей панели отвечал на вопрос "что требует моей реакции прямо сейчас?" за 1–2 секунды взгляда.

---

## Implementation Decisions

### Architecture

- **Монорепо** с пакетами: `backend` (Hono + Mastra + Drizzle + PostgreSQL), `student-app` (React + TypeScript + Tailwind, mobile-first), `psychologist-app` (React + TypeScript + Tailwind), `student-mobapp` и `psychologist-mobapp` (React Native, миграция в процессе), `shared` (доменные типы, test-definitions, i18n).
- **Бэкенд паттерн:** Routes → Services → Repositories → DB (Drizzle + PostgreSQL).
- **Source of truth для домена:** `UBIQUITOUS_LANGUAGE.md`. Имена таблиц, классов, полей в новом коде должны соответствовать канонической терминологии (Student, Psychologist, Invite Code, Crisis Signal, и т.д.).
- **Два AI-агента** в архитектуре:
  - **AI-Friend** (Mastra `supportAgent`) — для Student'а, без clinical role, без доступа к score/severity тестов.
  - **AI-Copilot** (Phase 2, отдельный Mastra-агент) — для Psychologist'а, полный доступ к объективным данным ученика, анализ через **Copilot Scan**, рекомендации через **Copilot Report** с inline action chips.

### New Deep Modules

| Module | Encapsulates | Interface |
|---|---|---|
| **AlmatyDay** | Таймзонные границы Asia/Almaty для всей системы | `currentDay()`, `slotOf(timestamp)`, `isSameDay(a, b)`, `daysBetween(a, b)` — pure-функции |
| **CrisisSignalRouter** | Единая точка приёма сигналов от SOS Urgent / AI-Friend / Diagnostics critical → маршрутизация в Red/Yellow Feed + создание notification | `route({ type, severity, studentId, summary, metadata })` |
| **InactivitySignal** | Список неактивных учеников психолога по пороговым правилам | `evaluate(psychologistId) → list of { studentId, daysInactive }` |
| **OfficeHours** | CRUD графика доступности психолога | Shallow CRUD |
| **EveningPromptScheduler** | Cron в 20:00 Asia/Almaty → находит студентов без Evening Slot → отправляет push | Shallow wrapper над cron |

### Reworked Modules

| Модуль | Изменения |
|---|---|
| **sos** | UI: 4 **SOS Action**'а (breathing/hotline/chat/urgent) без "уровней 1-3". Только `urgent` → CrisisSignalRouter. История всех action'ов сохраняется. |
| **mood** | Убрать ConflictError "один в сутки". Хранить все записи. Читать через AlmatyDay по слотам (Day/Evening). Триггер Streak только при первой записи за Almaty Day. |
| **ai-chat** | Объединить `crisisDetectionTool` + `notifyPsychologistTool` в один tool `crisis_signal` с параметрами `{ type: acute_crisis\|concern, severity: high\|medium\|low, summary, markers, category }`. Убрать передачу score и severity тестов в `buildStudentContext` (только факт прохождения). Убрать режимы сессии. Реализовать **Psychologist Redirect** как UX-действие в диалоге. Убрать `getFlaggedMessages`. |
| **diagnostics** | При severity=high или критических flagged items → вызвать CrisisSignalRouter. API `/test-sessions` для Student'а возвращает `{ requiresSupport: boolean, suggestedActions: [...] }` без score/severity. API для Psychologist'а отдаёт всё. |
| **invite-codes** | Добавить поле `studentRealName` (ФИО, задаётся психологом). Убрать `schoolId`. Массовая генерация с вводом ФИО каждого ученика. |
| **auth** | Регистрация ученика не принимает `name` (берёт из Invite Code). Не проставляет `schoolId` ученику. PATCH language синкает с клиентом. |
| **streaks** | Extract **StreakEngine** (pure logic: state machine по gap, freeze). Триггер при любом Productive Action. Не триггерить на Direct Chat. |
| **users** | `users.schoolId` хранится только при role=psychologist (для role=student — null). Язык — single source of truth, синкается с фронта при смене. |
| **notifications** | Типы унифицированы: `crisis_red` / `concern_yellow` / `info` / `chat`. Legacy типы (`crisis`, `sos_alert`, `concern_detected`, `appointment`) — на удаление. |
| **virtual-plant** | Extract **PlantGrowth** (pure: thresholds + sleep state). |
| **achievements** | Extract **AchievementChecker** (decision tree для trigger × condition). |
| **analytics** | Extract **AnalyticsAggregator** (pure агрегация stats). |
| **export** | Extract **CsvExportFormatter** (pure CSV row formatting). |

### Removed Modules

- **appointments** (таблицы `appointment_slots`, `appointments`; страницы SlotsManagementPage, AppointmentsListPage, AppointmentsPage; notification type `appointment`) — заменяется **OfficeHours**.
- **ai-chat.getFlaggedMessages** — нарушает приватность AI-Friend.

### Schema Changes

- `users.schoolId` — разрешён только для role=psychologist. У student — всегда null.
- `invite_codes` — добавить `student_real_name` (text, not null); убрать `school_id` (legacy).
- `mood_entries` — убрать уникальность "один в сутки"; добавить индекс по (user_id, day-in-Asia/Almaty) для чтения по слотам.
- `sos_events` — на длительную перспективу заменить `level` (int) на `type` (enum): `urgent`, `breathing`, `hotline`, `chat`. В MVP допустимо добавить `type` рядом с `level`, переиспользуя существующую таблицу.
- `notifications.type` — унифицировать значения (crisis_red, concern_yellow, info, chat). Старые строковые типы — миграция или толерантный чтение.
- `office_hours` — новая таблица: `{ psychologistId, date, intervals: jsonb, notes }` или `{ psychologistId, dayOfWeek, intervals }` с ежедневным переопределением.
- `appointment_slots`, `appointments` — удалить (migration drop, не-reversible).
- `student_dossier` (Phase 2) — закладывается как план, не создаётся в MVP.
- `diagnostic_ai_reports` — остаётся as-is, генерация на языке psychologist'а.

### API Contracts

- **Crisis Signal** — публичный интерфейс **CrisisSignalRouter.route()**:
  ```
  route({
    type: 'acute_crisis' | 'concern',
    severity: 'high' | 'medium' | 'low',
    studentId: string,
    summary: string,        // Signal Summary, на языке психолога
    source: 'sos_urgent' | 'ai_friend' | 'diagnostics',
    metadata?: Record<string, unknown>
  }) → { signalId, feed: 'red' | 'yellow', notificationIds: string[] }
  ```
- **Student test completion** — `POST /tests/sessions/:id/complete` возвращает Student'у `{ completed: true, requiresSupport: boolean, suggestedActions: Array<{ type, text, deeplink }> }` — без score, без severity.
- **AI-Friend `crisis_signal` tool** — объединённый tool с параметрами: `type`, `severity`, `category`, `markers`, `summary`. Вызывается агентом семантически (no keyword matching).
- **AI-Friend `psychologist_redirect` UX-hint** — возвращается в стриме как tool-call без сайд-эффектов; фронт рендерит кнопку "Написать [имя психолога]" → редирект в Direct Chat без переноса контекста.
- **Office Hours** — `GET /office-hours/:psychologistId?date=YYYY-MM-DD` возвращает доступность; `PUT /office-hours` для редактирования.
- **Inactivity Signal** — `GET /psychologist/inactive-students` возвращает список учеников с `daysInactive ≥ threshold`.

### Key Interactions

- **Productive Action triggers:** Mood Check-in (первая за день), Exercise, Journal Entry, CBT Entry, Test Session, AI-Friend user message — каждая вызывает `streakEngine.recordActivity()` + `plant.addPoints()` + `achievements.check()`. Direct Chat — не триггерит.
- **Critical Test Session:** при severity=high или critical flagged items → `crisisSignalRouter.route({ type: 'acute_crisis', severity: 'medium', source: 'diagnostics', ... })` + клиент получает `requiresSupport: true` для Soft Escalation.
- **Evening Prompt:** cron в 20:00 Asia/Almaty → для каждого студента проверить `mood_entries` в Evening Slot сегодня → если нет, отправить push.
- **AI-Friend крит/некрит разветвление:** промпт агента чётко различает критические (суицид/насилие/домогательства/систематический буллинг — `crisis_signal` тихо) и незначительные (конфликты/тревога перед экзаменом — `psychologist_redirect` в диалоге) сигналы.
- **Language for AI output:** AI-Friend отвечает на `student.language`; AI Test Report и AI-Copilot Report пишутся на `psychologist.language` независимо от языка данных ученика.

### Philosophy & Ethics (to be encoded in system prompts and code comments)

- **Safety over privacy at critical threshold:** AI-Friend системный промпт явно разделяет критические триггеры (silent `crisis_signal`) и незначительные (Psychologist Redirect с согласия).
- **No diagnoses to student:** ни один UI-экран Student'а не содержит слов "депрессия", "тревожность", "диагноз", severity-категорий, процентилей.
- **Minimal cognitive load (Student):** one-tap actions в кризисных контекстах; 2-4 явных опции, не шкалы.
- **Fast signal recognition (Psychologist):** каждый экран = "что требует реакции?" за 1–2 секунды.

---

## Testing Decisions

Тесты пишутся для Deep Modules, инкапсулирующих доменную логику. **Принцип:** тестируется **внешнее поведение** (входы → выходы), а не внутренняя структура. Доменная логика отделяется от БД и фреймворка, чтобы тесты были быстрыми и pure.

### Обязательные тесты (Critical + High Priority)

1. **AlmatyDay** — pure unit-тесты на `currentDay()`, `slotOf()`, `isSameDay()`, `daysBetween()`. Покрытие: пограничные часы (17:59 vs 18:00, полночь Asia/Almaty, переход летнего времени — нет DST в РК, но проверить), разные timezone'ы инпута, UTC edge cases.
2. **CrisisSignalRouter** — unit-тесты на `route()` со всеми комбинациями `type × severity × source` → ожидаемый `feed` и набор notification-типов. Покрытие всех путей маршрутизации + edge cases (студент без привязанного психолога).
3. **TestScoringEngine** — unit-тесты на каждый из 9 тестов (PHQ-A, GAD-7, SCARED, STAI, RSES, PSS-10, Буллинг, Выгорание, Социометрия). Покрытие: reverse scoring, null answers, edge-значения на границах severity, критические flagged items. Прецедент — баг с reverse scoring STAI (из PLAN.md P2-7).
4. **MoodAggregator** — unit-тесты на `getInsights()`: пустые данные, одна неделя, две недели с улучшением/ухудшением/стабильностью, топ-факторы, граничные значения порога тренда. Фиксация единого порога (текущая inconsistency 0.3 vs 0.5 в разных местах — устранить).
5. **StreakEngine** — unit-тесты на `recordActivity()`: gap=0 (тот же день), gap=1 (continue), gap=2 с/без freeze, gap>2 (reset), comparison dates as strings, первый ever. Прецедент — текущая реализация в `streaks.service.ts:33-85`.
6. **AchievementChecker** — unit-тесты на каждый из 16 ачивок: условие встречено / не встречено, уже полученное (не выдавать повторно), одновременная выдача нескольких.

### Желательные тесты (Medium Priority)

7. **PlantGrowth** — unit на `computeStage(points)` и `isSleeping(lastWateredAt)`.
8. **InactivitySignal** — unit на `evaluate()` с фикстурами разных сценариев активности.
9. **AnalyticsAggregator** — unit на class-level метрики: пустой класс, один ученик, смешанные severities.
10. **CsvExportFormatter** — unit на escaping (quotes, commas, newlines), UTF-8 BOM, CRLF line endings.

### Без тестов в MVP

- CRUD-модули (Auth, InviteCode, Users, Office Hours, Direct Chat, Content, Journal) — shallow, высокий cost/value ratio.
- UI-страницы — unit тесты компонентов не дают ценности при активном product-дизайне.
- Агентная оркестрация (support-agent instantiation, Mastra framework integration) — полагаемся на фреймворк.

### Что считается "хорошим тестом" в Tirek

- **Pure input → output:** никаких подключений к БД, к внешним сервисам, к файловой системе.
- **Один асserт на поведенческую единицу** (не на внутренний state).
- **Именование через доменные термины** из Ubiquitous Language (`should_route_acute_crisis_high_to_red_feed`, не `test_crisisService_1`).
- **Быстрые:** весь test suite за секунды, не за минуты.

---

## Out of Scope

### Out of scope для MVP (Phase 2+)

- **AI-Copilot** (фоновый агент на стороне психолога): **Student Dossier**, **Copilot Scan**, **Copilot Report** с inline action chips. Архитектурно предусмотрен, но не реализуется в MVP.
- **Long-term memory** для AI-Friend (агент "помнит" ученика за месяцы). Этический вопрос, откладываем.
- **Роли Admin / School Administrator / Parent** в приложении. В MVP только Student и Psychologist.
- **Multi-school / multi-psychologist** в одной школе. В MVP: один Psychologist ↔ одна School.
- **Интеграция с Kundelik.kz / eSchool**.
- **Модуль для родителей** (отдельный раздел, уведомления при кризисе, материалы).
- **Push-уведомления в каналы вне in-app** (email, SMS, Telegram). В MVP — только in-app notifications.
- **Автоперевод свободного текста ученика** (journal, mood notes, direct-chat) для психолога, говорящего на другом языке. На MVP — контент остаётся на языке ученика.
- **Регулярное автоматическое назначение тестов** (cron-расписание PHQ-A каждые 2 недели всему классу). Тесты назначаются только вручную психологом. AI-Copilot (Phase 2) будет рекомендовать назначения.
- **Раздел "Исследовать все тесты"** для ученика. Ученик видит только назначенные.
- **Сезонные модули** (осенняя адаптация, декабрьский стресс, экзаменационная весна).
- **Видео / аудио контент** (озвучка, психообразование в видео).
- **ML-модели прогнозирования рисков**.
- **Соревновательные элементы** (лидерборды) — принципиально никогда не делаем.

### Out of scope for PRD (архитектурные решения оставлены на этап имплементации)

- Конкретные миграционные шаги для легаси-полей (`sos_events.level`, `notifications.type` старые значения) — стратегия "по касанию": при реализации соответствующих фич.
- Конкретная модель `office_hours` таблицы (per-day JSON vs day-of-week с override) — решается при имплементации.
- Конкретная реализация InactivitySignal порога (3 дня? 5 дней? настраивается?) — sensible default в коде, обсудим после пилота.

---

## Further Notes

### Пилотный контекст

Первое разворачивание — **неофициальный эксперимент** в одной школе, где работает сестра разработчика (единственный Psychologist-пользователь MVP). Следствия:
- Ориентир — **сестрин UX** и обратная связь, не абстрактные best practices.
- **Масштаб** — одна школа, один психолог, десятки-сотни учеников.
- **Гибкость > формализация** — можно итерироваться быстро без юридических согласований на этом этапе.
- При масштабировании на официальные пилоты потребуется Phase 2 (AI-Copilot, admin/parent роли, аудит доступа, возможно multi-school).

### Юридический задел

PROJECT.md §9 фиксирует правовую базу РК (закон "О персональных данных", "О правах ребёнка", ст. 139 УК РК). Для официального развёртывания нужно:
- Информированное согласие ученика и родителей (до 14 лет обязательно).
- Политика конфиденциальности с явной декларацией "при угрозе жизни AI-Friend уведомит психолога".
- Хранение данных на территории РК.
- Audit log кризисных уведомлений.
- Этическая экспертиза.

Это всё **вне скоупа MVP** для пилота в школе сестры, но закладывается в Phase 2.

### Процесс работы

1. **PRD (этот документ)** — источник истины для "что делаем".
2. **UBIQUITOUS_LANGUAGE.md** — источник истины для "как это называется".
3. **PROJECT.md** — pitch / видение / миссия; новым читателям, демо.
4. **PLAN.md** — исторический трекер P0/P1/P2 (завершён до этого PRD); новые задачи идут через GitHub Issues (следующий шаг — `/to-issues`).
5. **Memory** (`.claude/projects/.../memory/`) — персистент решений разработчика с Claude.
6. **Каждый issue** реализуется через `/tdd` (написать тест → реализовать → зелёный).
7. **Раз в месяц** — `/improve-codebase-architecture` + `/ubiquitous-language` для удержания согласованности.
8. **Новая большая фича** — новая сессия `/grill-me`.

### Открытые вопросы (для будущих обсуждений)

- **Видит ли AI-Copilot содержание** разговоров ученика с AI-Friend, или только темы/flagged сигналы? (Приватность vs полнота картины для Phase 2.)
- **Информированное согласие** ученика про "AI в критических ситуациях уведомит психолога" — как формулировать в онбординге, чтобы не отпугивать от искренности.
- **Порог Inactivity Signal** (3 / 5 / 7 дней) — после пилота.
- **Канал для push-уведомлений** (FCM для мобильных, web push для panel'и) — реализация после MVP.
- **Качество казахского у supportAgent** — тестируется в пилоте. При плохом качестве — смена модели или доработка системного промпта.
