# Student App: Web → React Native (Expo) — План миграции

> Последнее обновление: 2026-04-12
> Статус: Фаза 6 (6.1–6.3) завершена

## Обзор

Миграция `packages/student-app` (Vite + React 19 + Tailwind + React Router) в `packages/student-mobapp` (Expo 54 + React Native 0.81 + StyleSheet + Expo Router).

**Источник:** `packages/student-app/src/` — 24 страницы, 14 API-модулей, Zustand auth, React Query, i18n (ru/kz)
**Цель:** `packages/student-mobapp/` — Expo с React Native StyleSheet, React Query, expo-router

### Ключевые отличия от веба

| Веб | React Native |
|-----|-------------|
| `localStorage` | `AsyncStorage` |
| `import.meta.env.VITE_API_URL` | `expo-constants` / `process.env.EXPO_PUBLIC_API_URL` |
| React Router (BrowserRouter) | Expo Router (file-based, `app/` dir) |
| Tailwind CSS v4 | React Native `StyleSheet` + `lib/theme/colors.ts` |
| SSE via `ReadableStream` | `react-native-sse` или `expo-event-source` polyfill |
| `<a href="tel:">` | `Linking.openURL("tel:")` |
| CSS анимации (`@keyframes`) | `react-native-reanimated` |
| `window.scrollTo` | `ScrollView` / `FlatList` ref |
| `clsx()` для условных классов | Массив стилей `[styles.a, condition && styles.b]` |
| Vite aliases (`@tirek/shared`) | Metro config + `tsconfig` paths |

---

## Фаза 0 — Фундамент

> Инфраструктура, без которой нельзя строить экраны. После этой фазы приложение запускается, показывает пустой экран, имеет навигацию и умеет делать API-запросы.

### 0.1 Конфигурация проекта
- [x] Обновить `app.json`: name → "Tirek Student", slug → `tirek-student`, bundle id → `kz.tirek.student`, orientation → portrait
- [x] Настроить environment: `EXPO_PUBLIC_API_URL` через `.env` + `expo-constants`
- [x] Подключить шрифт Nunito через `expo-font` (основной шрифт веб-версии)

### 0.2 Подключение `@tirek/shared`
- [x] Настроить `metro.config.js` — добавить `watchFolders: [path.resolve(__dirname, '../shared')]`
- [x] Настроить `tsconfig.json` — paths alias `@tirek/shared/*` → `../shared/src/*`
- [x] Проверить что импорты types, i18n, constants, validators работают
- [x] Добавить shared в `nodeModulesPaths` и `extraNodeModules`

### 0.3 API-клиент
- [x] Перенести `api/client.ts` — заменить `import.meta.env.VITE_API_URL` на `process.env.EXPO_PUBLIC_API_URL`
- [x] `ApiError` класс — перенести как есть
- [x] Проверить что `fetch` работает (React Native имеет встроенный `fetch`)
- [x] Адаптировать logout: вместо `window.location.href = '/login'` использовать `router.replace('/login')` из expo-router

### 0.4 Auth Store
- [x] Перенести `store/auth-store.ts` (Zustand)
- [x] Заменить persistence middleware: `localStorage` → `AsyncStorage` через `zustand/middleware` + `@react-native-async-storage/async-storage`
- [x] Сохранить интерфейс: `token`, `user`, `setAuth()`, `updateUser()`, `logout()`

### 0.5 i18n
- [x] Перенести `hooks/useLanguage.tsx`
- [x] Заменить `localStorage.getItem('tirek-language')` → `AsyncStorage.getItem('tirek-language')`
- [x] Импорты `ru`, `kz` из `@tirek/shared/i18n` — без изменений
- [x] `LanguageProvider` обернуть в root `_layout.tsx`

### 0.6 Навигация и Layout
- [x] Создать структуру Expo Router:
  ```
  app/
  ├── _layout.tsx          # Root layout (providers: QueryClient, Auth, Language, SafeArea)
  ├── (auth)/
  │   ├── _layout.tsx      # Stack без header
  │   ├── login.tsx
  │   ├── register.tsx
  │   └── onboarding.tsx
  ├── (tabs)/
  │   ├── _layout.tsx      # Bottom tab navigator
  │   ├── index.tsx         # Dashboard (home)
  │   ├── chat.tsx          # AI Chat
  │   ├── exercises.tsx     # Exercises list
  │   ├── mood.tsx          # Mood check-in
  │   └── profile.tsx       # Profile
  └── (screens)/
      ├── _layout.tsx       # Stack для вложенных экранов
      ├── sos.tsx
      ├── tests/
      ├── journal.tsx
      ├── messages/
      ├── appointments.tsx
      ├── plant.tsx
      └── achievements.tsx
  ```
- [x] Настроить bottom tab bar: 5 табов (Home, Chat, Exercises, Mood, Profile)
- [x] Стилизация tab bar: иконки из `@expo/vector-icons` (Ionicons)

### 0.7 Design Tokens и Theme
- [x] Перенести цветовую палитру в `lib/theme/colors.ts` (React Native StyleSheet, без NativeWind)
- [x] Все экраны используют `StyleSheet.create()` + `colors` из theme
- [x] Создать базовые утилитарные компоненты: `Text`, `Button`, `Card`, `Input` (обёртки с дефолтными стилями)

### Результат фазы 0
Приложение запускается, можно переключать табы, API client настроен, auth store работает, shared пакет подключён, i18n переключается.

---

## Фаза 1 — Auth + Dashboard

> Минимальный рабочий флоу: логин → dashboard → профиль.

### 1.1 Auth экраны
- [x] `login.tsx` — email/password форма, кнопка входа, ссылка на регистрацию
  - Источник: `pages/LoginPage.tsx`
  - API: `auth.login()` → `setAuth(token, user)`
- [x] `register.tsx` — email/password/name/invite code, выбор класса
  - Источник: `pages/RegisterPage.tsx`
  - API: `auth.register()`
- [x] `onboarding.tsx` — приветственные слайды (если есть)
  - Источник: `pages/OnboardingPage.tsx`
- [x] Protected route logic: в root `_layout.tsx` проверять `useAuthStore().token`, redirect на `/(auth)/login`

### 1.2 Dashboard
- [x] Перенести `pages/DashboardPage.tsx`:
  - Streak виджет (🔥 текущий + лучший)
  - Mood виджет (сегодняшнее настроение или кнопка check-in)
  - Next appointment виджет
  - Quote of the day
  - Quick actions grid (тесты, дыхание, journal, SOS, plant, achievements)
- [x] API модули: `api/streaks.ts`, `api/mood.ts` (today), `api/appointments.ts` (next), `api/content.ts` (quote)

### 1.3 Profile
- [x] Перенести `pages/ProfilePage.tsx`:
  - Отображение имени, email, класс
  - Переключатель языка (ru/kz)
  - Кнопка «Выйти»
  - Редактирование имени
- [x] API: `auth.getMe()`, `auth.updateProfile()`

### 1.4 Общие компоненты
- [x] `ErrorBoundary` — обёртка для crash-ов
- [x] `ErrorState` — компонент ошибки с retry
- [x] `NetworkStatus` — индикатор offline (через `@react-native-community/netinfo`)
- [x] `SOSButton` — floating кнопка SOS (абсолютное позиционирование)
- [x] `ConfirmDialog` — модальное окно подтверждения (React Native `Modal`)
- [x] Loading spinner компонент

### Результат фазы 1
Пользователь может зарегистрироваться/войти, увидеть dashboard с виджетами, изменить профиль, переключить язык, выйти.

---

## Фаза 2 — Core Features

> Основной ежедневный функционал.

### 2.1 Mood Tracking
- [x] `mood.tsx` (tab) — экран check-in:
  - 5 уровней настроения (emoji кнопки)
  - Факторы (school, friends, family, health, social, other) — toggle chips
  - Энергия, качество сна, стресс — слайдеры
  - Источник: `pages/MoodCheckInPage.tsx`
- [x] `mood-calendar.tsx` — кале��дарь настроений:
  - Цветовая кодировка дней
  - Инсайты (среднее, тренд)
  - Источник: `pages/MoodCalendarPage.tsx`
- [x] API: `api/mood.ts` — `submitMood()`, `getToday()`, `getCalendar()`, `getInsights()`

### 2.2 AI Chat
- [x] `chat.tsx` (tab) — основной чат:
  - SSE streaming через fetch + ReadableStream (RN 0.81 поддерживает)
  - Message bubbles (user / assistant)
  - Tool call нотификации
  - Typing индикатор во время стриминга
  - История сессий (список)
  - Источник: `pages/ChatPage.tsx`, `pages/ChatListPage.tsx`
- [x] API: `api/chat.ts` — `createSession()`, `getMessages()`, `streamMessage()`
- [x] Адаптация стриминга: fetch + ReadableStream + TextDecoder (нативная поддержка в RN 0.81)

### 2.3 Diagnostic Tests
- [x] `tests/index.tsx` — список тестов:
  - Доступные + назначенные тесты
  - Карточки тестов с описанием
  - Источник: `pages/TestsListPage.tsx`
- [x] `tests/[testId].tsx` — прохождение теста:
  - Один вопрос на экран, прогресс бар
  - Выбор ответа, переход к следующему
  - Источник: `pages/TestPage.tsx`
- [x] `tests/results/[sessionId].tsx` — результат:
  - Severity badge, score, рекомендации
  - Источник: `pages/TestResultPage.tsx`
- [x] API: `api/tests.ts` — `getTests()`, `getAssigned()`, `startTest()`, `submitAnswer()`, `completeTest()`, `getResult()`, `getHistory()`

### 2.4 SOS / Crisis
- [x] `sos.tsx` — кризисный экран:
  - 3 уровня (выбор серьёзности)
  - Level 3 — красное предупреждение
  - Отправка алерта психологу
  - Экстренные телефоны — `Linking.openURL('tel:...')`
  - Кнопки перехода к дыхательным упражнениям
  - Источник: `pages/SOSPage.tsx`
- [x] API: `api/sos.ts` — `sendSOS(level)`
- [x] Данные: `hotlines` из `@tirek/shared/constants`

### Результат фазы 2
Полноценный ежедневный флоу: mood → chat → tests → SOS. Покрывает ~70% использования.

---

## Фаза 3 — Exercises & Therapy

> Терапевтические инструменты и техники.

### 3.1 Exercises List
- [x] `exercises.tsx` (tab) — каталог упражнений:
  - Карточки с типом, описанием, иконкой
  - Роутинг по типу (breathing / grounding / cbt / relaxation)
  - Статистика выполнений
  - Источник: `pages/ExercisesListPage.tsx`
- [x] API: `api/exercises.ts` — `getExercises()`, `getStats()`, `completeExercise()`

### 3.2 Breathing Exercises
- [x] `exercises/breathing.tsx`:
  - Square breathing (4-4-4-4)
  - 4-7-8 technique
  - Diaphragmatic breathing
  - Анимированный круг (Animated API) — вдох/задержка/выдох
  - Haptic feedback на переходах (`expo-haptics`)
  - Источник: `pages/BreathingPage.tsx`

### 3.3 Grounding (5-4-3-2-1)
- [x] `exercises/grounding.tsx`:
  - 5 шагов: see/touch/hear/smell/taste
  - Пошаговый интерфейс с прогрессом
  - Haptic на каждом шаге
  - Источник: `pages/GroundingPage.tsx`

### 3.4 PMR (Progressive Muscle Relaxation)
- [x] `exercises/pmr.tsx`:
  - Группы мышц, таймеры (напрячь/расслабить)
  - Пошаговые инструкции
  - Источник: `pages/PMRPage.tsx`

### 3.5 Thought Diary (CBT)
- [x] `exercises/thought-diary.tsx`:
  - Форма: ситуация, мысли, эмоции, рациональный ответ
  - Список предыдущих записей
  - Источник: `pages/ThoughtDiaryPage.tsx`
- [x] API: `api/cbt.ts` — `getEntries()`, `createEntry()`, `updateEntry()`, `deleteEntry()`

### Результат фазы 3
Все терапевтические инструменты работают. Дыхательные упражнения с нативными анимациями и haptic.

---

## Фаза 4 — Communication

> Связь с психологом: чат и записи.

### 4.1 Direct Chat
- [x] `messages/index.tsx` — список бесед:
  - Карточка с именем, последнее сообщение, время, unread badge
  - Источник: `pages/DirectChatListPage.tsx`
- [x] `messages/[conversationId].tsx` — чат:
  - Bubble messages (left/right)
  - Auto-scroll к последнему
  - Отправка текста, индикатор загрузки
  - Источник: `pages/DirectChatPage.tsx`
- [x] API: `api/direct-chat.ts` — `getConversations()`, `getMessages()`, `sendMessage()`, `markRead()`, `getUnreadCount()`
- [x] Hook `useDirectChatUnread` — badge на табе/навигации

### 4.2 Appointments
- [x] `appointments.tsx`:
  - Просмотр слотов по неделям (горизонтальный скролл)
  - Бронирование с опциональной заметкой
  - Отмена записи
  - Статусы: scheduled/confirmed/cancelled/completed
  - Источник: `pages/AppointmentsPage.tsx`
- [x] API: `api/appointments.ts` — `getSlots()`, `bookAppointment()`, `cancelAppointment()`, `getMyAppointments()`, `getNext()`

### 4.3 Push Notifications
- [x] Установить `expo-notifications`
- [x] Регистрация push token на backend
- [x] Обработка нотификаций: переход на нужный экран по типу
- [x] Типы: новое сообщение от психолога, напоминание о записи, результат теста, кризис

### Результат фазы 4
Полноценная коммуникация с психологом + push уведомления.

---

## Фаза 5 — Gamification & Content

> Вовлечённость и удержание.

### 5.1 Virtual Plant
- [x] `plant.tsx`:
  - 4 стадии роста (seed → sprout → growing → blooming)
  - Анимации роста (Reanimated)
  - Название растения (редактирование)
  - Прогресс бар до следующей стадии
  - Статус «сна» при неактивности
  - Источник: `pages/VirtualPlantPage.tsx`
- [x] API: `api/plant.ts` — `getPlant()`, `renamePlant()`

### 5.2 Achievements
- [x] `achievements.tsx`:
  - 4 категории: first_steps, streak, mastery, growth
  - Прогресс (earned / total)
  - Emoji-иконки, статус earned/locked
  - Источник: `pages/AchievementsPage.tsx`
- [x] API: `api/achievements.ts` — `getAchievements()`, `getSummary()`

### 5.3 Journal
- [x] `journal.tsx`:
  - Список записей с датами
  - Создание новой записи
  - Daily prompt (двуязычный)
  - Удаление записей
  - Источник: `pages/JournalPage.tsx`
- [x] API: `api/journal.ts` — `getEntries()`, `createEntry()`, `deleteEntry()`, `getPrompt()`

### 5.4 Streaks (уже на dashboard)
- [x] Убедиться что streak widget полноценно работает
- [x] API: `api/streaks.ts` — `getStreak()`

### Результат фазы 5
Все фичи вовлечённости на месте. Приложение feature-complete.

---

## Фаза 6 — Polish & Release

> Доводка, оптимизация, публикация.

### 6.1 Dark Theme
- [x] ThemeProvider с `useColorScheme` + AsyncStorage persistence (system / light / dark)
- [x] Тёмная палитра для всех design tokens (`darkColors` в `lib/theme/colors.ts`)
- [x] Переключатель в Profile (system / light / dark) с иконками
- [x] Все экраны, layouts, UI компоненты обновлены на `useThemeColors()`

### 6.2 UX Polish
- [x] Haptic feedback на кнопках и key actions (`lib/haptics.ts` + Button, SOS, mood, chat)
- [x] Pull-to-refresh на 10 списочных экранах (RefreshControl)
- [x] Skeleton loaders вместо спиннеров (компонент `Skeleton`, `SkeletonCard`, `SkeletonList`)
- [x] Keyboard avoiding view на формах (chat, mood, journal)
- [ ] Плавные переходы между экранами (Shared Element Transitions, если нужно)

### 6.3 Offline Support
- [x] React Query persistence (`@tanstack/react-query-persist-client` + `AsyncStorage`)
- [x] Offline indicator (NetInfo) — `NetworkStatus` компонент
- [x] Очередь мутаций через `onlineManager` — мутации паузятся при offline, возобновляются при reconnect

### 6.4 Branding & Assets
- [ ] Splash screen — брендированный (logo Tirek)
- [ ] App icon — адаптивная иконка Android + iOS
- [ ] Store screenshots (6.5" и 5.5" для iOS, phone для Android)
- [ ] Store descriptions (ru/kz/en)

### 6.5 Production
- [ ] Error tracking: `expo-sentry` или аналог
- [ ] OTA updates: `expo-updates`
- [ ] Deep linking: `expo-linking` (tirek://student/...)
- [ ] Analytics: базовая аналитика (screen views, key events)
- [ ] App Store Connect + Google Play Console — создание приложений
- [ ] TestFlight / Internal Testing → первый релиз

### Результат фазы 6
Приложение готово к публикации в App Store и Google Play.

---

## Справочник: маппинг файлов Web → Mobile

| Web (`student-app/src/`) | Mobile (`student-mobapp/`) | Фаза |
|---|---|---|
| `api/client.ts` | `lib/api/client.ts` | 0 |
| `api/auth.ts` | `lib/api/auth.ts` | 0 |
| `store/auth-store.ts` | `lib/store/auth-store.ts` | 0 |
| `hooks/useLanguage.tsx` | `lib/hooks/useLanguage.tsx` | 0 |
| `hooks/useDirectChatUnread.ts` | `lib/hooks/useDirectChatUnread.ts` | 4 |
| `pages/LoginPage.tsx` | `app/(auth)/login.tsx` | 1 |
| `pages/RegisterPage.tsx` | `app/(auth)/register.tsx` | 1 |
| `pages/OnboardingPage.tsx` | `app/(auth)/onboarding.tsx` | 1 |
| `pages/DashboardPage.tsx` | `app/(tabs)/index.tsx` | 1 |
| `pages/ProfilePage.tsx` | `app/(tabs)/profile.tsx` | 1 |
| `pages/MoodCheckInPage.tsx` | `app/(tabs)/mood.tsx` | 2 |
| `pages/MoodCalendarPage.tsx` | `app/(screens)/mood-calendar.tsx` | 2 |
| `pages/ChatPage.tsx` | `app/(tabs)/chat.tsx` | 2 |
| `pages/ChatListPage.tsx` | `app/(screens)/chat-history.tsx` | 2 |
| `pages/TestsListPage.tsx` | `app/(screens)/tests/index.tsx` | 2 |
| `pages/TestPage.tsx` | `app/(screens)/tests/[testId].tsx` | 2 |
| `pages/TestResultPage.tsx` | `app/(screens)/tests/results/[sessionId].tsx` | 2 |
| `pages/SOSPage.tsx` | `app/(screens)/sos.tsx` | 2 |
| `pages/ExercisesListPage.tsx` | `app/(tabs)/exercises.tsx` | 3 |
| `pages/BreathingPage.tsx` | `app/(screens)/exercises/breathing.tsx` | 3 |
| `pages/GroundingPage.tsx` | `app/(screens)/exercises/grounding.tsx` | 3 |
| `pages/PMRPage.tsx` | `app/(screens)/exercises/pmr.tsx` | 3 |
| `pages/ThoughtDiaryPage.tsx` | `app/(screens)/exercises/thought-diary.tsx` | 3 |
| `pages/DirectChatListPage.tsx` | `app/(screens)/messages/index.tsx` | 4 |
| `pages/DirectChatPage.tsx` | `app/(screens)/messages/[conversationId].tsx` | 4 |
| `pages/AppointmentsPage.tsx` | `app/(screens)/appointments.tsx` | 4 |
| `pages/VirtualPlantPage.tsx` | `app/(screens)/plant.tsx` | 5 |
| `pages/AchievementsPage.tsx` | `app/(screens)/achievements.tsx` | 5 |
| `pages/JournalPage.tsx` | `app/(screens)/journal.tsx` | 5 |
| `components/ui/ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | 1 |
| `components/ui/ErrorState.tsx` | `components/ErrorState.tsx` | 1 |
| `components/ui/NetworkStatus.tsx` | `components/NetworkStatus.tsx` | 1 |
| `components/ui/SOSButton.tsx` | `components/SOSButton.tsx` | 1 |
| `components/ui/ConfirmDialog.tsx` | `components/ConfirmDialog.tsx` | 1 |
| `index.css` (design tokens) | `lib/theme/colors.ts` (StyleSheet tokens) | 0 |

---

## Как работать с этим планом

1. Открываешь новый контекст Claude Code
2. Говоришь: "Работаем по MIGRATION_STUDENT_MOBAPP.md, фаза N"
3. Claude читает этот файл, смотрит что нужно, читает исходники из `student-app`, пишет код в `student-mobapp`
4. По завершении фазы отмечаем `[x]` и обновляем статус
