# Ubiquitous Language

> Извлечено из сессии /grill-me (2026-04-24). Источник — 14 продуктовых решений, зафиксированных в memory + диалог о ролях, кризисах, AI-архитектуре и пилоте.

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
| **Office Hours** | График работы Psychologist'а: ежедневно редактируемые интервалы, когда она в кабинете/доступна | schedule, availability slots |
| **Student Profile** | Карточка Student'а в psychologist-app: Mood-тренды, Test Sessions, Crisis Signals, приватные заметки | student card, dossier-view |
| **Private Note** | Приватная заметка Psychologist'а о Student'е, невидима Student'у | comment, annotation |
| **Student Dossier** | Структурированная AI-поддерживаемая анкета Student'а для AI-Copilot'а: инциденты, тесты, тренды, темы (Phase 2) | profile, history |
| **Copilot Report** | Сообщение AI-Copilot'а Psychologist'у с рекомендациями и inline action buttons (Phase 2) | analysis, AI recommendation |
| **Copilot Scan** | Периодический (раз в день/несколько дней) запуск AI-Copilot'а, анализирующий всех Student'ов Psychologist'а (Phase 2) | analysis batch, daily scan |

## Время, язык, пилот

| Термин | Определение | Aliases to avoid |
|--------|-------------|------------------|
| **Almaty Day** | Календарные сутки в таймзоне Asia/Almaty — канонические сутки для всех границ (Mood слоты, Streak, Inactivity) | server day, UTC day |
| **Interface Language** | Язык UI пользователя, хранится в `users.language`, источник истины для AI-Friend и AI-Copilot | locale, lang |
| **Pilot School** | Первая школа разворачивания Tirek — школа, где работает сестра разработчика; неофициальный эксперимент | prod, first deployment |

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

- **"Mode"** (режим AI-чата: general/talk/problem/exam/discovery) — устарело, фронт уже убрал выбор режима. **AI-Friend Session** теперь без режима; тональность агент выбирает по первому сообщению Student'а.

- **"Language"** — может означать **Interface Language** (настройка пользователя), язык теста (Test хранит nameRu/nameKz), или язык свободного текста Student'а в Journal/Mood Note. Source of truth для AI — `users.language` текущего пользователя (Student для AI-Friend, Psychologist для AI-Copilot и AI Test Report).
