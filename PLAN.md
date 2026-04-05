# Tirek — План доработок MVP

> Последнее обновление: 2026-04-05
> Статус: P0 завершён, P1 завершён, P2 в процессе

---

## Общее состояние проекта

| Пакет | Реализация | Состояние |
|-------|-----------|-----------|
| **Backend** | 13 модулей, 17 таблиц, ~30 эндпоинтов | ~90% MVP |
| **Student-app** | 15 страниц, 8 API-модулей | ~80% MVP |
| **Psychologist-app** | 11 страниц, 8 API-модулей | ~85% MVP |

---

## P0 — Критичные для MVP демо ✅ ЗАВЕРШЁН

> Все 6 задач выполнены и проверены (Vite build clean, 0 новых TS ошибок).

| Задача | Что сделано |
|--------|------------|
| **P0-1** | DiagnosticsPage `userId→studentId`, Sidebar `data?.length`, 4 строки → i18n |
| **P0-2** | `EXERCISES[]` хардкод → `exercisesApi.list()` + useQuery, nameRu/nameKz по языку |
| **P0-3** | SOSPage: UI выбора уровня 1-3, level 3 красный + предупреждение |
| **P0-4** | monthNames/weekdays → i18n (ru+kz), секция topFactors с emoji |
| **P0-5** | Оба ProfilePage: кнопка "Ред.", форма name+avatar, `updateUser()` в store |
| **P0-6** | `getMoodDistribution`, `testCompletionRate`, `atRiskCount`, `status`, `testSlug`, `getStudentDetail` обогащён |

---

## P1 — Важные для полноты MVP ✅ ЗАВЕРШЁН

> Все 8 задач выполнены. Vite build clean для обоих приложений.

### P1-1. Техника заземления 5-4-3-2-1
- **Пакет:** student-app, backend (seed)
- **Статус:** ✅ Завершено
- **Детали:**
  - Интерактивный пошаговый гид: "Назови 5 вещей, которые видишь → 4 звука → 3 ощущения → 2 запаха → 1 вкус"
  - Добавить упражнение в seed (тип: grounding)
  - Новая страница или компонент в student-app (аналогично BreathingPage)

### P1-2. Прогрессивная мышечная релаксация (ПМР)
- **Пакет:** student-app, backend (seed)
- **Статус:** ✅ Завершено
- **Детали:**
  - Пошаговый гид: напряжение → удержание → расслабление групп мышц
  - Таймер для каждого шага
  - Добавить упражнение в seed (тип: relaxation)

### P1-3. Журналирование / Дневник
- **Пакет:** student-app, backend (новый модуль)
- **Статус:** ✅ Завершено
- **Детали:**
  - Новая таблица `journal_entries` (userId, prompt, content, createdAt)
  - Промпты дня: "Сегодня я чувствую…", "Три хороших вещи за день", "Что меня беспокоит"
  - CRUD API: создание, просмотр списка, удаление
  - Страница в student-app: список записей + новая запись

### P1-4. Геймификация: серии (streaks)
- **Пакет:** student-app, backend
- **Статус:** ✅ Завершено
- **Детали:**
  - Бэкенд: подсчёт дней подряд с mood check-in (или любой активностью)
  - Новое поле или таблица для хранения streak данных
  - Student-app Dashboard: виджет с текущей серией + рекорд
  - "Заморозка" серии — не наказывать за пропуск (растение "засыпает")

### P1-5. Dashboard улучшения
- **Пакет:** student-app
- **Статус:** ✅ Завершено
- **Детали:**
  - Streak counter виджет (зависит от P1-4)
  - Улучшенные карточки быстрого доступа
  - Показать прогресс (сколько тестов пройдено, упражнений сделано)

### P1-6. Flagged messages — просмотр для психолога
- **Пакет:** backend, psychologist-app
- **Статус:** ✅ Завершено
- **Детали:**
  - Бэкенд: `GET /psychologist/flagged-messages` — сообщения помеченные crisis detection
  - Psychologist-app: секция или страница с помеченными сообщениями (без полного содержания чата — только флаг + контекст)

### P1-7. Принудительный crisis detection
- **Пакет:** backend
- **Статус:** ✅ Завершено
- **Детали:**
  - Сейчас crisis-detection tool вызывается только если AI-агент решит его вызвать
  - Нужно: вызывать keyword-based detection на КАЖДОЕ входящее сообщение ученика ДО отправки агенту
  - Если обнаружены маркеры → автоматически создать SOS event + уведомление, независимо от агента

### P1-8. Экспорт PDF/Excel
- **Пакет:** backend, psychologist-app
- **Статус:** ✅ Завершено
- **Детали:**
  - Бэкенд: эндпоинты для генерации PDF/Excel отчётов по ученику и классу
  - Psychologist-app: кнопки "Скачать PDF" / "Скачать Excel" на страницах аналитики и диагностики

---

## P2 — Улучшения (после MVP)

> Фичи для Фазы 2, не блокируют демо.

### P2-1. Чат ученик ↔ психолог ✅
- **Статус:** Завершено
- **Детали:**
  - DB: таблицы `conversations` + `direct_messages` с crisis detection
  - Backend: модуль `direct-chat/` (repository, service, routes) для обоих ролей
  - Student-app: страницы DirectChatListPage + DirectChatPage, BottomNav badge, Dashboard quick link
  - Psychologist-app: страницы DirectChatListPage + DirectChatPage, Sidebar badge, StudentDetailPage кнопка
  - Polling: 5сек на активном чате, 30сек для unread count
  - Notifications: type "direct_message" с навигацией к беседе

### P2-2. Запись на приём ✅
- **Статус:** Завершено
- **Детали:**
  - DB: таблицы `appointment_slots` + `appointments`
  - Backend: модуль `appointments/` (repository, service, routes) для обоих ролей
  - Student-app: AppointmentsPage (полоска дат + доступные слоты + booking modal), Dashboard виджет + quickLink
  - Psychologist-app: SlotsManagementPage (создание/удаление слотов + repeat weekly), AppointmentsListPage (список записей + confirm/cancel/complete), Sidebar пункт
  - Notifications: type "appointment" при booking/cancel/confirm
  - i18n: ru + kz

### P2-3. Виртуальный персонаж ✅
- **Статус:** Завершено
- **Детали:**
  - DB: таблица `user_plants` (userId PK, growthPoints, stage 1-4, name, lastWateredAt)
  - Backend: модуль `virtual-plant/` (repository, service, routes) — GET + PATCH /name
  - Механика роста: mood +10, exercises +15, journal +10 очков (fire-and-forget)
  - Пороги стадий: росток (0-49), кустик (50-149), дерево (150-299), цветущее дерево (300+)
  - "Сон" при неактивности 2+ дня (визуальный, БЕЗ штрафов)
  - Student-app: виджет на Dashboard + отдельная страница /plant с редактированием имени
  - i18n: ru + kz (18 ключей)

### P2-4. Достижения/значки ✅
- **Статус:** Завершено
- **Детали:**
  - DB: таблицы `achievements` (16 определений) + `user_achievements` (earned tracking)
  - Backend: модуль `achievements/` (repository, service, routes) для обоих ролей
  - 16 достижени�� в 4 категориях: первые шаги, серии, мастерство, рост
  - Fire-and-forget проверка при каждой активности (mood, exercise, journal, test, streak, plant)
  - Notification при получении нового достижения
  - Student-app: AchievementsPage (grid earned/locked) + Dashboard виджет + quickLink
  - Psychologist-app: вкладка "Достижения" на StudentDetailPage
  - i18n: ru + kz

### P2-5. КПТ-упражнения ✅
- **Статус:** Завершено
- **Детали:**
  - DB: таблица `cbt_entries` (userId, type, data JSONB, createdAt)
  - Backend: модуль `cbt/` (repository, service, routes) для обоих ролей
  - 4 типа упражнений: thought_diary, circle_of_control, stop_technique, behavioral_experiment
  - 4 упражнения в seed с type="cbt" в exercises таблице
  - Валидация данных по типу + fire-and-forget gamification (streak, plant +15, achievements)
  - Student-app: 4 интерактивные страницы (ThoughtDiaryPage — wizard 5 шагов, CircleOfControlPage — 2 зоны, StopTechniquePage — 4 шага СТОП, BehavioralExperimentPage — двухфазный с update)
  - Каждая страница: история записей + удаление
  - ExerciseRouterPage: dispatch по type="cbt" → config.cbtType
  - Psychologist-app: вкладка "КПТ" на StudentDetailPage с read-only записями
  - i18n: ru + kz (~60 ключей, 10 когнитивных искажений)

### P2-6. Тёмная тема ✅
- **Статус:** Завершено
- **Детали:**
  - CSS: `@custom-variant dark`, семантические токены (surface, border, input-border) в `:root` и `.dark`
  - Student-app: тёплая тёмная палитра (#1A1614 bg, #252019 surface, #E8E0D8 text)
  - Psychologist-app: холодная тёмная палитра (#0F1117 bg, #1A1D27 surface, #E2E8F0 text)
  - ThemeProvider (Context + localStorage "tirek-theme") в обоих apps
  - Anti-FOUC script в index.html (синхронный, до React)
  - 3 режима: Светлая / Тёмная / Системная (prefers-color-scheme)
  - Переключатель в ProfilePage обоих приложений
  - ~400 замен bg-white→bg-surface, border-gray→border-border и т.д. в ~47 файлах
  - dark: варианты для градиентных виджетов, цветных карточек, статус-бейджей
  - Shadow overrides для dark mode (все shadow-sm/md/lg)
  - i18n: ru + kz (4 ключа)

### P2-7. Дополнительные тесты (6 штук)
- SCARED, Спилбергер-Ханин, PSS-10, Опросник буллинга, Учебное выгорание, Социометрия

### P2-8. Admin панель
- Управление школами, психологами, системным контентом
- Отдельное приложение или раздел

### P2-9. Safety Plan (SOS)
- Персональный план безопасности ученика
- Заполняется заранее, показывается при SOS

### P2-10. Назначение упражнений
- Психолог назначает конкретные упражнения ученику/классу
- Student-app показывает "назначенные" отдельно

### P2-11. Мотивационный контент
- Вдохновляющие истории
- Карточки-аффирмации с визуалами
- Управление контентом из панели психолога

---

## Как работать с этим планом

1. **Агент получает задачу**: "Реализуй P0" (или P1, P2)
2. **Читает этот файл** для контекста по каждой задаче
3. **Реализует задачи** последовательно внутри группы
4. **Отмечает статус**: ❌ → 🔄 → ✅
5. **Переходит к следующей группе** после завершения текущей
