# Ubiquitous Language

> Извлечено из сессии /grill-me (2026-04-24), обновлено в /grill-me (2026-04-27, ревизия psychologist-mobapp UX). Источник — продуктовые решения и расхождения между моделью и кодом.

## Люди и роли

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Student** | Ученик 5–11 класса, пользователь student-app | child, pupil, user-student |
| **Psychologist** | Школьный психолог, пользователь psychologist-app | counselor, therapist, specialist |
| **AI-Friend** | LLM-агент, общающийся с Student как дружеский собеседник, без клинической роли | chatbot, assistant, AI, supportAgent (это имя класса, не домена) |
| **AI-Copilot** | LLM-агент, работающий на стороне Psychologist как фоновый аналитик; Phase 2 | analyst-AI, co-psychologist |
| **School** | Учебное заведение; в модели домена — метаданные профиля Psychologist | organization, institution |

## Приглашение и идентичность

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Invite Code** | Одноразовый код, создаваемый Psychologist'ом для конкретного Student'а (с ФИО, классом), активируется Student'ом при регистрации | invitation, registration code, signup code |
| **Class Code** | Строка формата `{grade}{classLetter}`, например "7А" — идентификатор класса внутри School | group, form |
| **Real Name** | ФИО Student'а по классному журналу, задаётся Psychologist'ом в Invite Code, не редактируется Student'ом | full name, official name |
| **Display Name** | Локальный ник Student'а, хранится только на клиенте (localStorage / AsyncStorage); невидим Psychologist'у | alias, nickname, handle |

## Рефлексия и самопомощь

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Mood Check-in** | Единичная запись Student'а о настроении (1–5) + опц. стресс, сон, энергия, факторы, заметка | mood entry, mood log, checkin |
| **Day Slot** | Mood Check-in, сделанный **до 18:00 Asia/Almaty** | morning checkin, pre-evening |
| **Evening Slot** | Mood Check-in, сделанный **после 18:00 Asia/Almaty** | night checkin, post-evening |
| **Evening Prompt** | Пуш-уведомление в 20:00 Asia/Almaty, если в Evening Slot ещё нет записи | evening reminder, night push |
| **Productive Action** | Любое действие Student'а, засчитывающееся в Streak: Mood Check-in, Exercise, Journal Entry, CBT Entry, Test Session, AI-Friend сообщение. Все вызывающие сервисы делегируют последствия (streak/plant/achievements) единому **Productive Action Coordinator** (`packages/backend/src/modules/productive-action/`), который атомарно применяет их в одной транзакции и идемпотентен по Almaty Day | activity, engagement |
| **Exercise** | Техника самопомощи (дыхание, заземление, ПМР, body scan, safe place, КПТ-практика) | activity, task, practice |
| **Journal Entry** | Свободная текстовая запись Student'а в дневник по промпту или без | diary entry, note |
| **CBT Entry** | Запись в одном из 4 когнитивно-поведенческих инструментов (Thought Diary, Circle of Control, STOP, Behavioral Experiment) | therapy record, КПТ-запись |
| **Streak** | Счётчик последовательных дней с хотя бы одним Productive Action | daily series, consecutive days |
| **Plant** | Виртуальное растение Student'а, растёт при Productive Action, «засыпает» при неактивности (без обнуления) | pet, avatar, garden |

## Диагностика

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Test** | Валидированный опросник (PHQ-A, GAD-7, STAI, и т.д.) — определение с вопросами и правилами подсчёта | questionnaire, survey, assessment |
| **Test Assignment** | Назначение Psychologist'ом конкретного Test'а конкретному Student'у или классу, с опц. дедлайном | task, prescription |
| **Test Session** | Факт прохождения Student'ом Test'а: ответы, totalScore, severity | test result, submission, attempt |
| **Severity** | Категория результата Test Session: `low` / `moderate` / `high` (видна только Psychologist'у) | risk level, diagnosis (не использовать!) |
| **Flagged Item** | Ответ в Test Session, помеченный как требующий внимания (например, пункт про суицид в PHQ-A) | red answer, warning answer |
| **AI Test Report** | AI-сгенерированная интерпретация Test Session для Psychologist'а (summary, riskFactors, recommendations); всегда на языке Psychologist'а | test interpretation, AI analysis |
| **Completion Screen** | Экран в student-app после прохождения Test'а: мягкое сообщение + action buttons, **без показа score/severity** | result screen |
| **Soft Escalation** | Вариант Completion Screen при критическом результате: мягкое сообщение + кнопки "Написать психологу" / "Позвонить 150" / "Подышать"; параллельно создаётся Crisis Signal | gentle warning |

## Навигация psychologist-app

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Main Screen** | Первый экран Psychologist'а: проактивный обзор + сквозной слой кризисов; содержит Crisis Feed (red), Attention List, Inactivity List | dashboard, home (home — допустим, dashboard — нет) |
| **Attention List** | Блок на Main Screen: Yellow Crisis Signals + Student'ы с **Risk Status** ≠ `normal` без активных red-сигналов | watch list, attention queue |
| **Inactivity List** | Блок на Main Screen: Student'ы с **Inactivity Signal** без других активных сигналов | dormant list, silent list |
| **Diagnostics Catalog** | Сегмент таба Диагностика: список доступных Test'ов с метаинфой; вход в детальный экран Test'а и в назначение | tests library, test list |
| **Test Detail** | Экран Test'а: описание, целевая группа, длительность, tips для Psychologist'а; внизу — две кнопки запуска назначения (ученику / классу) | test info |
| **Assignment List** | Сегмент таба Диагностика: список всех Test Assignments с фильтром по статусу (`pending` / `in_progress` / `completed` / `expired` / `cancelled`) | assigned tests, assignments overview |
| **Results List** | Сегмент таба Диагностика: список завершённых Test Sessions с фильтрами (testSlug, severity, grade) | test results |
| **Active Students** | Сегмент таба Ученики: зарегистрированные Student'ы (активировавшие Invite Code) | registered, joined |
| **Pending Students** | Сегмент таба Ученики: Invite Code'ы со статусом `available` или `expired` (ожидают активации) | unregistered, awaiting |

## Кризисы и сигналы

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **SOS Button** | Одна кнопка в student-app, видна на всех экранах; ведёт на SOS Screen | emergency button, panic button |
| **SOS Screen** | Экран с 4 опциями помощи Student'у без когнитивной нагрузки: Breathing, Hotline, Write Psychologist, Urgent Help | SOS page, emergency screen |
| **SOS Action** | Конкретный выбор Student'а на SOS Screen: `breathing` / `hotline` / `chat` / `urgent` | SOS level (устарело — больше не шкала) |
| **Urgent Help** | SOS Action с немедленным уведомлением Psychologist'а по Red Feed | SOS level 3, panic |
| **Crisis Signal** | Унифицированное событие "требуется внимание Psychologist'а", создаётся либо ручным Urgent Help, либо AI-Friend'ом через tool | SOS event, alert, crisis event |
| **Crisis Signal Type** | Классификация Crisis Signal: `acute_crisis` (суицид, насилие, домогательства) / `concern` (буллинг, семья, тревожность) | category |
| **Crisis Signal Severity** | Глубина сигнала для маршрутизации: `high` / `medium` / `low` (назначается AI-Friend'ом или системой) | urgency, priority |
| **Red Feed** | Лента Crisis Signal'ов у Psychologist'а, требующих реакции сегодня: Urgent Help + acute_crisis | urgent queue, critical list |
| **Yellow Feed** | Лента Crisis Signal'ов для фонового внимания в течение недели: concern любой severity | concern list, attention queue |
| **Signal Summary** | Краткое описание ситуации на языке Psychologist'а в Crisis Signal, написанное AI-Friend'ом; НЕ содержит дословных слов Student'а | flag text, alert body |
| **Inactivity Signal** | Отдельный сигнал Psychologist'у: Student не заходил в приложение X дней | silence alert, absence warning |

## Общение

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **AI-Friend Chat** | Приватный чат Student'а с AI-Friend'ом; Psychologist не видит содержимое | AI conversation, bot chat |
| **AI-Friend Session** | Одна отдельная беседа в AI-Friend Chat (с thread-level памятью) | thread, conversation |
| **Direct Chat** | Переписка Student'а с Psychologist'ом; живой канал, не AI | chat, message thread, DM |
| **Psychologist Redirect** | Действие AI-Friend'а при незначительной проблеме: рекомендация Student'у написать Psychologist'у + кнопка перехода в Direct Chat **без переноса контекста** | handoff, transfer |

## Рабочее пространство психолога

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Office Hours Template** | Недельный шаблон работы Psychologist'а (пн-вс), задаётся один раз и редко редактируется | weekly schedule, availability template |
| **Office Hours Override** | Per-date исключение (выходной / другие часы), перекрывающее **Office Hours Template** на конкретную дату | exception, day-off |
| **Office Hours** | Действующие часы работы Psychologist'а на конкретную дату — результат разрешения **Office Hours Template** + **Office Hours Override** для этой даты | schedule, availability |
| **Student Profile** | Mini-app Psychologist'а для работы с конкретным Student'ом: единый скролл с Overview + Timeline + Danger Zone, без вложенных табов | student card, dossier-view |
| **Overview** | Верхняя секция Student Profile: текущий **Risk Status** + причина, активные Crisis Signals, Mood за 7 дней, активные Test Assignments, достижения, ближайший приём | summary, dashboard |
| **Timeline** | Хронологический поток событий Student'а в Student Profile: Test Sessions, Mood Check-ins, CBT Entries, сообщения, изменения **Risk Status**, Crisis Signals; с фильтр-чипами по типу | history, feed, log |
| **Danger Zone** | Нижняя секция Student Profile с финальными необратимыми действиями (Detach Student) | destructive zone |
| **Detach Student** | Действие Psychologist'а: разорвать связь со Student'ом, не удаляя его из системы | unlink, disconnect |
| **Risk Status** | Производный категориальный уровень риска Student'а: `normal` / `attention` / `crisis`, рассчитывается на лету по severity всех его Test Sessions; persistent state не хранится | risk level, status, severity (последнее — атрибут Test Session, не Student'а!) |
| **Student Dossier** | Структурированная AI-поддерживаемая анкета Student'а для AI-Copilot'а: инциденты, тесты, тренды, темы (Phase 2) | profile, history |
| **Copilot Report** | Сообщение AI-Copilot'а Psychologist'у с рекомендациями и inline action buttons (Phase 2) | analysis, AI recommendation |
| **Copilot Scan** | Периодический (раз в день/несколько дней) запуск AI-Copilot'а, анализирующий всех Student'ов Psychologist'а (Phase 2) | analysis batch, daily scan |

## Время, язык, пилот

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Almaty Day** | Календарные сутки в таймзоне Asia/Almaty — канонические сутки для всех границ (Mood слоты, Streak, Inactivity) | server day, UTC day |
| **Interface Language** | Язык UI пользователя, хранится в `users.language`, источник истины для AI-Friend и AI-Copilot | locale, lang |
| **Pilot School** | Первая школа разворачивания Tirek — школа, где работает сестра разработчика; неофициальный эксперимент | prod, first deployment |

## Решение

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Crisis Signal Resolution** | Действие Psychologist'а по разбору Crisis Signal: пометка обработанным с `contactedStudent`/`contactedParent`/`documented` флагами + текстом резолюции | close, dismiss |
| **Acknowledged Signal** | Crisis Signal, разобранный Psychologist'ом — уходит из Red/Yellow Feed, остаётся в Timeline Student'а как событие | resolved (зарезервировано под `resolvedAt` поле) |

## Отношения

- **Psychologist** создаёт **Invite Code** с **Real Name** и **Class Code** для конкретного будущего **Student**'а.
- **Student** активирует один **Invite Code** → создаётся связь **Student ↔ Psychologist**.
- Одна **School** принадлежит одному **Psychologist**'у в MVP (метаданные профиля).
- **Student** делает 0..N **Mood Check-in**'ов за **Almaty Day**, из них для **Psychologist**'а видны последняя в **Day Slot** и последняя в **Evening Slot**.
- **Productive Action** включает **Mood Check-in**, **Exercise**, **Journal Entry**, **CBT Entry**, **Test Session**, сообщение в **AI-Friend Chat** — но НЕ **Direct Chat**.
- **Productive Action** инкрементирует **Streak** (максимум раз в **Almaty Day**) и растит **Plant**.
- **Psychologist** создаёт **Test Assignment** → **Student** проходит **Test** → создаётся **Test Session** + **AI Test Report**.
- **Test Session** с **Severity** = `high` или с критическими **Flagged Items** → автоматически создаёт **Crisis Signal** (type=acute_crisis) + **Soft Escalation** на **Completion Screen**.
- **SOS Button** → **SOS Screen** → **SOS Action** (`urgent` → **Crisis Signal** type=acute_crisis, severity=high; остальные — без сигнала Psychologist'у, только история).
- **AI-Friend** при критической реплике Student'а создаёт **Crisis Signal** (tip=acute_crisis) молча; при незначительной — делает **Psychologist Redirect** в диалоге.
- **Crisis Signal** маршрутизируется в **Red Feed** (acute_crisis, Urgent Help) или **Yellow Feed** (concern).
- **Signal Summary** в **Crisis Signal** — единственный способ **Psychologist**'у узнать о содержании диалога **Student**'а с **AI-Friend**'ом.
- **Risk Status** Student'а — производная функция от severity его **Test Sessions** (`high` → `crisis`, `moderate` → `attention`, иначе `normal`); НЕ persistent state, без истории и manual override в MVP.
- **Office Hours Template** + **Office Hours Override** разрешаются в **Office Hours** для конкретной даты; **Student** видит только итоговые Office Hours, **Psychologist** редактирует обе сущности.
- **Office Hours** на текущую дату фильтруют push-уведомления Psychologist'а: red Crisis Signal'ы пушатся 24/7, yellow и обычные Direct Chat сообщения — только в Office Hours.
- **AI-Copilot** (Phase 2) читает **Student Dossier** и в **Copilot Report** предлагает **Test Assignment** / контакт / и т.д.; **Psychologist** утверждает.

## Пример диалога

> **Dev:** "Что происходит, если Student проходит **Test Session** по PHQ-A и severity выходит high?"

> **Domain expert:** "Два параллельных эффекта. Student видит **Completion Screen** в варианте **Soft Escalation** — мягкое сообщение и кнопки 'Написать психологу', 'Позвонить 150', 'Подышать'. Он НЕ видит score и НЕ видит слово 'депрессия'. Параллельно система создаёт **Crisis Signal** с type=`acute_crisis`, severity=`medium` и пушит в **Red Feed** Psychologist'а."

> **Dev:** "А если Student в это время писал **AI-Friend**'у и там всплыли суицидальные мысли?"

> **Domain expert:** "**AI-Friend** молча вызывает crisis-tool → ещё один **Crisis Signal** с type=`acute_crisis`, severity=`high`, **Signal Summary** на языке Psychologist'а. Student ничего не видит — иначе сломаем доверие. Но если бы он сказал про конфликт с подругой — это незначительное, **AI-Friend** делает **Psychologist Redirect** в диалоге: 'ты можешь написать [имя], хочешь — открою чат?' — и кнопка ведёт на **Direct Chat** **без переноса контекста**."

> **Dev:** "А **AI-Friend** видит результат PHQ-A?"

> **Domain expert:** "Нет. Только факт, что Student недавно проходил **Test Session** — дату и имя теста. Score и severity скрыты от **AI-Friend**'а, чтобы он не начал играть в квази-врача. Эти данные видит только **AI-Copilot** (Phase 2), который работает на стороне Psychologist'а, не Student'а."

> **Dev:** "И **Streak** — если Student сегодня только написал **AI-Friend**'у, без **Mood Check-in**, он считается?"

> **Domain expert:** "Да, сообщение в **AI-Friend Chat** — это **Productive Action**. **Mood Check-in** — не единственный путь. Но сообщение в **Direct Chat** с Psychologist'ом **не считается** Productive Action — иначе получится, что Student 'зарабатывает' стрик через общение с человеком, а это неправильная мотивация."

## Flagged ambiguities

- **"SOS level" (0/1/2/3)** в текущем коде — **устаревшая модель**. Заменяется на **SOS Action** (`breathing`/`hotline`/`chat`/`urgent`) + **Crisis Signal Type** + **Crisis Signal Severity**. Шкала 0-3 путала серьёзность ситуации с выбранным действием и с AI-сигналами. Не использовать в новом коде.

- **"Notification"** в текущей БД имеет 5+ типов (`crisis`, `sos_alert`, `concern_detected`, `appointment`, `direct_message`, `achievement`) — это зоопарк. В новой модели: `crisis_red` / `concern_yellow` / `info` / `chat` (и `appointment` уходит вместе с откатом booking). **Notification** — это канал, а **Crisis Signal** — доменное событие; их не путать.

- **"Session"** используется в трёх разных смыслах: **AI-Friend Session** (thread беседы с AI), **Test Session** (одно прохождение теста), и HTTP/JWT session (техническое). В домене — только первые два, всегда с префиксом.

- **"Name"** — было перегружено: `users.name` ученика задавался самим учеником при регистрации. Сейчас — **Real Name** (от Psychologist'а через Invite Code) и опциональный **Display Name** (клиентский). Сервер знает только Real Name.

- **"Message"** — в Direct Chat и AI-Friend Chat это разные концепты с разной приватностью. В Direct Chat сообщение — часть Переписки Student↔Psychologist, Psychologist видит дословно. В AI-Friend Chat сообщение — приватно, Psychologist видит только **Signal Summary** если был **Crisis Signal**, не дословно.

- **"Appointment"** — устаревшее понятие booking-модели, откатывается в пользу **Office Hours** (info-блок без бронирования). Таблицы `appointment_slots` и `appointments` в БД — legacy.

- **"Office Hours" в текущем коде = per-date запись** (одна таблица `office_hours`, без шаблона). Это устаревшая интерпретация: пользователь хотел weekly + override, не per-date primary. Новая модель: **Office Hours Template** (7 строк по дню недели) + **Office Hours Override** (только исключения per-date) → разрешаются в актуальные **Office Hours** на дату.

- **"Status"** перегружен: на стороне Test Session это `severity` (low/moderate/high), на стороне Student Profile это **Risk Status** (normal/attention/crisis), на стороне Test Assignment это lifecycle (pending/in_progress/completed/expired/cancelled). Не путать.

- **"Notes"** ранее использовалось для **Private Note** (заметки Psychologist'а о Student'е) — эта фича удаляется из MVP вместе с таблицей и API. Существующее `notes` в **Office Hours Template/Override** — это короткая подпись к интервалам ("онлайн", "уехала"), отдельный концепт, не Private Note.

- **"Notifications"** как inbox-сущность удаляется из MVP. Все сигналы доходят до Psychologist'а через табовые бейджи (Crisis Signals, Direct Chat) и push-уведомления, отфильтрованные **Office Hours**. Отдельный экран уведомлений и `notificationsApi.getUnreadCount` уходят.

- **"Mode"** (режим AI-чата: general/talk/problem/exam/discovery) — устарело, фронт уже убрал выбор режима. **AI-Friend Session** теперь без режима; тональность агент выбирает по первому сообщению Student'а.

- **"Language"** — может означать **Interface Language** (настройка пользователя), язык теста (Test хранит nameRu/nameKz), или язык свободного текста Student'а в Journal/Mood Note. Source of truth для AI — `users.language` текущего пользователя (Student для AI-Friend, Psychologist для AI-Copilot и AI Test Report).
