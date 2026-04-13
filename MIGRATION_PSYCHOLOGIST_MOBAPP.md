# Psychologist App: Web → React Native (Expo) — План миграции

> Последнее обновление: 2026-04-12
> Статус: Фаза 6 завершена — миграция complete

## Обзор

Миграция `packages/psychologist-app` (Vite + React 19 + Tailwind + React Router) в `packages/psychologist-mobapp` (Expo 54 + React Native 0.81 + NativeWind + Expo Router).

**Источник:** `packages/psychologist-app/src/` — 15 страниц, 13 API-модулей, Zustand auth, React Query, i18n (ru/kz)
**Цель:** `packages/psychologist-mobapp/` — Expo template (уже создан, есть каркас с React Query + SafeArea)

### Особенности psychologist-app vs student-app

| Аспект | Student | Psychologist |
|--------|---------|-------------|
| Роль | Ученик | Психолог / Админ |
| Навигация | 5 табов (Home, Chat, Exercises, Mood, Profile) | 4 таба + "More" (Dashboard, Students, Messages, Crisis + menu) |
| Специфичные фичи | Mood, Exercises, Plant, Achievements | Students list, Student detail, Diagnostics, Crisis, Analytics, Slots, Invite codes, Notes, Export |
| Real-time | AI чат SSE | Badges (crisis, unread) с polling 30s |
| Сложность | Простые CRUD экраны | Таблицы, графики, фильтрация, экспорт |

### Ключевые отличия от веба

| Веб | React Native |
|-----|-------------|
| `localStorage` | `AsyncStorage` |
| `import.meta.env.VITE_API_URL` | `process.env.EXPO_PUBLIC_API_URL` |
| React Router (BrowserRouter) | Expo Router (file-based, `app/` dir) |
| Tailwind CSS v4 | NativeWind v4 (subset Tailwind) |
| `glass-card` (backdrop-blur) | Нет backdrop-blur в RN, заменить на solid surface + shadow |
| `<table>` HTML | FlatList / custom rows |
| CSS анимации (`@keyframes`) | `react-native-reanimated` |
| `window.open` / `<a download>` | `expo-sharing` / `expo-file-system` для экспорта |
| `clsx()` для условных классов | то же самое, работает с NativeWind |
| Vite aliases (`@tirek/shared`) | Metro config + `tsconfig` paths |
| lucide-react (иконки) | `@expo/vector-icons` (Ionicons / MaterialCommunityIcons) |
| DM Sans шрифт | `expo-font` + DM Sans |

---

## Фаза 0 — Фундамент ✅ ЗАВЕРШЕНА

> Инфраструктура, без которой нельзя строить экраны. После этой фазы приложение запускается, показывает пустой экран, имеет навигацию и умеет делать API-запросы.

### 0.1 Конфигурация проекта
- [x] Обновить `app.json`: name → "Tirek Psychologist", slug → `tirek-psychologist`, bundle id → `kz.tirek.psychologist`, orientation → portrait
- [x] Настроить environment: `EXPO_PUBLIC_API_URL` через `.env` + `expo-constants`
- [x] Подключить шрифт DM Sans через `expo-font` (основной шрифт веб-версии)
- [x] Добавить зависимости: `zustand`, `@tanstack/react-query-persist-client`, `@react-native-community/netinfo`, `expo-notifications`, `expo-device`
- [x] Убрать NativeWind из babel.config.js (используем StyleSheet, как в student-mobapp)

### 0.2 Подключение `@tirek/shared`
- [x] Настроить `metro.config.js` — добавить `watchFolders`, `nodeModulesPaths`, `extraNodeModules`
- [x] Настроить `tsconfig.json` — paths alias `@tirek/shared/*` → `../shared/src/*`
- [x] Проверить что импорты types, i18n работают (tsc --noEmit clean)

### 0.3 API-клиент
- [x] Перенести `api/client.ts` — заменить `import.meta.env.VITE_API_URL` на `process.env.EXPO_PUBLIC_API_URL`
- [x] `ApiError` класс — перенесён как есть
- [x] Адаптировать logout: `router.replace('/login')` из expo-router
- [x] Перенести `api/auth.ts` — login(), getMe(), updateProfile()

### 0.4 Auth Store
- [x] Перенести `store/auth-store.ts` (Zustand + AsyncStorage + `_hasHydrated`)
- [x] Persistence: `createJSONStorage(() => AsyncStorage)`, ключ `"tirek-psychologist-auth"`
- [x] Интерфейс: `token`, `user`, `_hasHydrated`, `setAuth()`, `updateUser()`, `logout()`

### 0.5 i18n
- [x] Перенести `hooks/useLanguage.tsx` с AsyncStorage вместо localStorage
- [x] Импорты `ru`, `kz` из `@tirek/shared/i18n` — без изменений
- [x] `LanguageProvider` обёрнут в root `_layout.tsx`

### 0.6 Навигация и Layout
- [x] Создать структуру Expo Router: `(auth)`, `(tabs)`, `(screens)` группы
- [x] Настроить bottom tab bar: 5 табов (Dashboard, Students, Messages, Crisis, More)
- [x] "More" таб: grid-меню с 6 пунктами (Diagnostics, Appointments, Invite Codes, Analytics, Profile, Notifications)
- [x] Стилизация tab bar: Ionicons, DMSans-SemiBold, themed colors
- [x] Auth gate: `index.tsx` проверяет `_hasHydrated` → `token` → redirect
- [x] Root layout: PersistQueryClientProvider > LanguageProvider > ThemeProvider > SafeAreaProvider > ErrorBoundary > ThemedApp

### 0.7 Design Tokens и Theme
- [x] Цветовая палитра в JS объектах (`lib/theme/colors.ts`): light (shared) + dark (холодная палитра психолога)
- [x] ThemeProvider с AsyncStorage (system/light/dark), spacing, typography, shadows
- [x] Базовые UI компоненты: `Text`, `Button`, `Card`, `Input`, `Badge`
- [x] Компоненты инфраструктуры: `Loading`, `ErrorBoundary`, `NetworkStatus`
- [x] Утилиты: `haptics.ts`, `offline.ts` (OnlineManager)
- [x] QueryClient: gcTime 24h, staleTime 5min, AsyncStorage persister

### Результат фазы 0
Приложение запускается, можно переключать табы, API client настроен, auth store работает, shared пакет подключён, i18n переключается, тема работает.

---

## Фаза 1 — Auth + Dashboard + Profile ✅ ЗАВЕРШЕНА

> Минимальный рабочий флоу: логин → dashboard → профиль.

### 1.1 Auth экран
- [x] `login.tsx` — email/password форма, кнопка входа
  - Источник: `pages/LoginPage.tsx`
  - API: `authApi.login()` → `setAuth(token, user)`
  - Проверка роли: только `psychologist` / `admin`
- [x] Protected route logic: в root `_layout.tsx` + `index.tsx` проверяет `useAuthStore().token`, redirect на `/(auth)/login`

### 1.2 Dashboard
- [x] Перенести `pages/DashboardPage.tsx`:
  - Сводка по кризисам (active alerts count + severity)
  - Сводка по ученикам (total, at risk)
  - Quick actions (Students, Crisis, Diagnostics, Messages)
  - Статистика (mood overview, average mood)
  - Источник: `pages/DashboardPage.tsx`
- [x] API модули: `api/analytics.ts`, `api/crisis.ts`, `api/notifications.ts`, `api/students.ts`

### 1.3 Profile
- [x] Перенести `pages/ProfilePage.tsx`:
  - Отображение имени, email, роли
  - Переключатель языка (ru/kz)
  - Переключатель темы (light/dark/system)
  - Кнопка «Выйти» с ConfirmDialog
  - Редактирование имени
- [x] API: `authApi.me()`, `authApi.updateProfile()`

### 1.4 Общие компоненты
- [x] `ErrorBoundary` — обёртка для crash-ов (из фазы 0)
- [x] `ErrorState` — компонент ошибки с retry
- [x] `NetworkStatus` — индикатор offline (из фазы 0)
- [x] `ConfirmDialog` — модальное окно подтверждения (React Native `Modal`)
- [x] `SeverityBadge` — badge уровня severity (minimal/mild/moderate/severe)
- [x] `StatusBadge` — badge статуса (normal/attention/crisis)
- [x] Loading spinner компонент (из фазы 0)

### 1.5 More tab навигация
- [x] Навигация из "More" таба на Profile экран
- [x] i18n-изация меток меню

### Результат фазы 1
Психолог может войти, увидеть dashboard со сводкой, изменить профиль, переключить язык, выйти.

---

## Фаза 2 — Students & Crisis (Core) ✅ ЗАВЕРШЕНА

> Основные рабочие экраны психолога: список учеников и кризисные алерты.

### 2.1 Students List
- [x] `students.tsx` (tab) — список учеников:
  - Поиск по имени/email
  - Фильтры: горизонтальные чипы grade (1-11) и class (A-E)
  - Карточка ученика: аватар, имя, класс, последний mood emoji, статус
  - Tap → переход на Student Detail
  - Источник: `pages/StudentsListPage.tsx`
- [x] API: `api/students.ts` — уже существовал с фазы 0
- [x] Адаптация: ScrollView с карточками вместо HTML table

### 2.2 Student Detail
- [x] `students/[id].tsx` — детальная страница ученика:
  - **Hero Card**: аватар с цветным ring по статусу, имя, StatusBadge, grade/email, 3 метрики (mood trend, risk level, engagement)
  - **Табы** (segmented control):
    - **Overview**: MoodSparkline (react-native-svg), recent tests, recent CBT, achievements summary
    - **Assessments**: 3 суб-таба (Tests/CBT/Achievements), тест карточки с SeverityBadge, CBT записи, achievements grid
    - **Notes**: CRUD заметок психолога (TextInput multiline, add/edit/cancel/save)
  - **Actions**: написать сообщение (stub → messages), ActionMenu (export CSV, detach)
  - Источник: `pages/StudentDetailPage.tsx`, `components/student/*`
- [x] API: `lib/api/notes.ts`, `lib/api/cbt.ts`, `lib/api/achievements.ts`, `lib/api/export.ts`
- [x] Компоненты: `StudentHeroCard`, `StudentOverviewTab`, `StudentAssessmentsTab`, `StudentNotesTab`, `MoodSparkline`, `ActionMenu`
- [x] Утилита: `lib/utils/mood-analytics.ts` (calculateMoodTrend, calculateEngagement, statusToRiskLevel)

### 2.3 Crisis Alerts
- [x] `crisis.tsx` (tab) — кризисные алерты:
  - 3 секции: Active Alerts, Flagged Messages, Resolved History
  - Карточка: аватар, имя, grade, level badge, time ago, student notes
  - Пульсирующая рамка для L3 (react-native-reanimated withRepeat)
  - Действия: view profile, write message, resolve (bottom sheet Modal)
  - Resolve Modal: чеклист (contacted student/parent/documented) + notes textarea
  - Источник: `pages/CrisisPage.tsx`
- [x] API: `api/crisis.ts` — уже существовал с фазы 0
- [x] Badge на табе: count активных алертов (polling 30s) в _layout.tsx
- [x] Flagged messages секция с warning-стилями
- [x] Resolved history (collapsible, lazy-load)

### 2.4 Notifications
- [x] `notifications.tsx`:
  - SectionList с группировкой по дате (Today/Yesterday/Date)
  - Type emoji icons (crisis, sos_alert, direct_message, assignment и др.)
  - Mark as read при tap
  - Tap → навигация: crisis → crisis tab, direct_message → messages tab
  - Unread dot + bold title для непрочитанных
  - Источник: `pages/NotificationsPage.tsx`
- [x] API: `api/notifications.ts` — уже существовал с фазы 0
- [x] Bell icon на Dashboard (greeting row) с unread badge
- [x] Notifications пункт в More tab с route

### Результат фазы 2
Психолог видит учеников, их детальные профили, кризисные алерты. Покрывает ~60% ежедневного использования.

---

## Фаза 3 — Communication ✅ ЗАВЕРШЕНА

> Связь с учениками: чат и записи на приём.

### 3.1 Direct Chat List
- [x] `messages.tsx` (tab) — список бесед:
  - Карточка: имя ученика, последнее сообщение, время, unread badge
  - Поиск по имени
  - Pull-to-refresh
  - Источник: `pages/DirectChatListPage.tsx`
- [x] API: `lib/api/direct-chat.ts` — `conversations()`, `createConversation()`, `messages()`, `send()`, `markRead()`, `unreadCount()`
- [x] Badge на табе: total unread (polling 30s)

### 3.2 Direct Chat
- [x] `messages/[conversationId].tsx` — чат с учеником:
  - Bubble messages (left = student, right = psychologist)
  - Auto-scroll к последнему сообщению
  - Отправка текста, индикатор загрузки
  - Mark as read при открытии
  - KeyboardAvoidingView
  - Polling каждые 5 секунд
  - Источник: `pages/DirectChatPage.tsx`
- [x] API: `lib/api/direct-chat.ts` — `messages()`, `send()`, `markRead()`

### 3.3 Appointments List
- [x] `appointments/index.tsx` — список записей:
  - Карточки: ученик, дата/время, статус (scheduled/confirmed/cancelled/completed)
  - Действия: confirm, cancel, complete (с ConfirmDialog)
  - Табы: Предстоящие / Все
  - Pull-to-refresh
  - Источник: `pages/AppointmentsListPage.tsx`
- [x] API: `lib/api/appointments.ts` — `list()`, `updateStatus()`

### 3.4 Slots Management
- [x] `appointments/slots.tsx` — управление слотами:
  - Week date strip с навигацией
  - Создание слотов (дата, время начала/конца)
  - Repeat weekly (1-8 недель)
  - Удаление слотов (с ConfirmDialog)
  - Список существующих слотов по дням
  - Pull-to-refresh
  - Источник: `pages/SlotsManagementPage.tsx`
- [x] API: `lib/api/appointments.ts` — `createSlots()`, `getSlots()`, `deleteSlot()`

### 3.5 Навигация и интеграция
- [x] More tab: appointments route подключён
- [x] Student Detail: кнопка "Написать сообщение" → создаёт беседу и открывает чат
- [x] Unread badge на Messages tab (polling 30s)

### 3.6 Push Notifications (отложено)
- [ ] Push notifications отложены — в вебе тоже используется HTTP polling
- [ ] При необходимости можно добавить в будущей фазе

### Результат фазы 3
Полноценная коммуникация с учениками + управление расписанием. Покрывает ~80% ежедневного использования.

---

## Фаза 4 — Diagnostics & Analytics ✅ ЗАВЕРШЕНА

> Инструменты оценки и аналитика.

### 4.1 Diagnostics
- [x] `diagnostics/index.tsx` — страница диагностики:
  - Список всех тест-сессий по ученикам
  - Фильтры: тест (PHQ-A/GAD-7/Rosenberg), severity, grade, дата (from/to)
  - Карточка: аватар, ученик, тест, score, severity badge, дата
  - Tap → навигация на Student Detail
  - Источник: `pages/DiagnosticsPage.tsx`
- [x] API: `lib/api/diagnostics.ts` — `getResults()`, `assignTest()`

### 4.2 Assign Test
- [x] `diagnostics/assign.tsx` — назначение теста:
  - Выбор теста из `testDefinitions` (@tirek/shared), локализация ru/kz
  - Переключатель target: класс / ученик
  - Класс: grade chips + classLetter chips
  - Ученик: поиск + список с checkmark
  - Дата (optional): TextInput YYYY-MM-DD
  - Submit → success screen → auto router.back()
  - Источник: `pages/AssignTestPage.tsx`
- [x] API: `lib/api/diagnostics.ts` — `assignTest()`

### 4.3 Analytics
- [x] `analytics.tsx` — аналитика:
  - 4 StatCard (2x2): totalStudents, averageMood, testCompletion%, atRisk
  - Mood distribution (StackedBar: happy/neutral/sad + LegendItems)
  - Risk distribution (StackedBar: normal/attention/crisis + LegendItems)
  - Фильтры: grade + classLetter chips
  - Pull-to-refresh
  - Источник: `pages/AnalyticsPage.tsx`
- [x] API: `lib/api/analytics.ts` — `classReport()` (уже существовал)
- [x] Компоненты: `StackedBar`, `LegendItem` (View-based, без charting library), `StatCard`

### 4.4 Export
- [x] Кнопки CSV экспорта на экранах Diagnostics и Analytics
  - Используется `Linking.openURL` с token в query (как в существующем `lib/api/export.ts`)
  - Upgrade на `expo-file-system` + `expo-sharing` отложен на Фазу 6
- [x] Навигация: More tab → diagnostics/analytics routes подключены
- [x] Dashboard quick actions → навигация на assign-test и analytics

### Результат фазы 4
Все аналитические и диагностические инструменты работают. CSV экспорт через Linking.openURL. Навигация подключена из More tab и Dashboard.

---

## Фаза 5 — Admin Tools & Invite Codes ✅ ЗАВЕРШЕНА

> Административные функции.

### 5.1 Invite Codes
- [x] `invite-codes.tsx` — управление инвайт-кодами:
  - Генерация новых кодов (для класса)
  - Список существующих кодов (код, класс, статус used/unused, ученик)
  - Копирование кода: `Clipboard.setStringAsync()` из `expo-clipboard`
  - Деактивация / удаление кодов
  - Источник: `pages/InviteCodesPage.tsx`
- [x] API: `lib/api/inviteCodes.ts` — `generate()`, `list()`, `revoke()`
- [x] Навигация: More tab → invite-codes route подключён

### 5.2 Student Notes (уже на Student Detail)
- [x] CRUD заметок полноценно работает в Student Detail (Create, Read, Update)
- [x] API: `lib/api/notes.ts` — `getAll()`, `add()`, `update()` — всё подключено

### Результат фазы 5
Все административные инструменты на месте. Приложение feature-complete.

---

## Фаза 6 — Polish & Release ✅ ЗАВЕРШЕНА

> Доводка, оптимизация, публикация.

### 6.1 Dark Theme (реализовано ранее)
- [x] ThemeProvider с system/light/dark режимами, AsyncStorage persistence
- [x] Холодная тёмная палитра: `#0F1117 bg`, `#1A1D27 surface`, `#E2E8F0 text`
- [x] Переключатель в Profile (system / light / dark)

### 6.2 UX Polish
- [x] Haptic feedback на кнопках и key actions (`expo-haptics`) — 7 функций, все экраны
- [x] Pull-to-refresh на всех списках (Students, Messages, Crisis, Diagnostics, Appointments и др.)
- [x] Skeleton loaders вместо спиннеров — компонент `Skeleton.tsx` (Skeleton, SkeletonCard, SkeletonList), заменены на 12 экранах
- [x] KeyboardAvoidingView на формах (login, profile, notes, assign test, slots, invite codes, crisis resolve modal)
- [x] Плавные переходы между экранами — `slide_from_right` для screens, `fade` для auth и root

### 6.3 Offline Support (реализовано ранее)
- [x] React Query persistence (`@tanstack/react-query-persist-client` + `AsyncStorage`, 24h cache)
- [x] Offline indicator (NetInfo + NetworkStatus bar)
- [x] OnlineManager — автоматическая пауза/возобновление мутаций

### 6.4 Branding & Assets (реализовано ранее)
- [x] Splash screen — брендированный с dark mode поддержкой
- [x] App icon — адаптивная иконка Android (foreground/background/monochrome) + iOS
- [ ] Store screenshots (6.5" и 5.5" для iOS, phone для Android)
- [ ] Store descriptions (ru/kz/en)

### 6.5 Production
- [x] Error tracking: `@sentry/react-native` — init, wrap, ErrorBoundary capture
- [x] OTA updates: `expo-updates` — checkForUpdate() на mount + кнопка в Profile
- [x] Deep linking: scheme `tirek-psychologist` (Expo Router file-based)
- [x] Not Found screen: `+not-found.tsx` для невалидных deep links
- [x] ErrorBoundary dark mode fix — рефакторинг на function component ErrorFallback
- [x] CSV export: `expo-file-system` + `expo-sharing` — native share sheet
- [x] App version display + check updates button в Profile
- [ ] App Store Connect + Google Play Console — создание приложений
- [ ] TestFlight / Internal Testing → первый релиз

### Результат фазы 6
Приложение feature-complete и polish-complete. Готово к сборке через EAS Build и публикации.

---

## Справочник: маппинг файлов Web → Mobile

### Pages

| Web (`psychologist-app/src/`) | Mobile (`psychologist-mobapp/`) | Фаза |
|---|---|---|
| `pages/LoginPage.tsx` | `app/(auth)/login.tsx` | 1 |
| `pages/DashboardPage.tsx` | `app/(tabs)/index.tsx` | 1 |
| `pages/ProfilePage.tsx` | `app/(screens)/profile.tsx` | 1 |
| `pages/StudentsListPage.tsx` | `app/(tabs)/students.tsx` | 2 |
| `pages/StudentDetailPage.tsx` | `app/(screens)/students/[id].tsx` | 2 |
| `pages/CrisisPage.tsx` | `app/(tabs)/crisis.tsx` | 2 |
| `pages/NotificationsPage.tsx` | `app/(screens)/notifications.tsx` | 2 |
| `pages/DirectChatListPage.tsx` | `app/(tabs)/messages.tsx` | 3 |
| `pages/DirectChatPage.tsx` | `app/(screens)/messages/[conversationId].tsx` | 3 |
| `pages/AppointmentsListPage.tsx` | `app/(screens)/appointments/index.tsx` | 3 |
| `pages/SlotsManagementPage.tsx` | `app/(screens)/appointments/slots.tsx` | 3 |
| `pages/DiagnosticsPage.tsx` | `app/(screens)/diagnostics/index.tsx` | 4 |
| `pages/AssignTestPage.tsx` | `app/(screens)/diagnostics/assign.tsx` | 4 |
| `pages/AnalyticsPage.tsx` | `app/(screens)/analytics.tsx` | 4 |
| `pages/InviteCodesPage.tsx` | `app/(screens)/invite-codes.tsx` | 5 |

### API модули

| Web (`psychologist-app/src/`) | Mobile (`psychologist-mobapp/`) | Фаза |
|---|---|---|
| `api/client.ts` | `lib/api/client.ts` | 0 |
| `api/auth.ts` | `lib/api/auth.ts` | 0 |
| `api/students.ts` | `lib/api/students.ts` | 2 |
| `api/crisis.ts` | `lib/api/crisis.ts` | 2 |
| `api/notifications.ts` | `lib/api/notifications.ts` | 2 |
| `api/direct-chat.ts` | `lib/api/direct-chat.ts` | 3 |
| `api/appointments.ts` | `lib/api/appointments.ts` | 3 |
| `api/diagnostics.ts` | `lib/api/diagnostics.ts` | 4 |
| `api/analytics.ts` | `lib/api/analytics.ts` | 4 |
| `api/cbt.ts` | `lib/api/cbt.ts` | 2 |
| `api/achievements.ts` | `lib/api/achievements.ts` | 2 |
| `api/notes.ts` | `lib/api/notes.ts` | 2 |
| `api/export.ts` | `lib/api/export.ts` | 4 |
| `api/inviteCodes.ts` | `lib/api/inviteCodes.ts` | 5 |

### Stores & Hooks

| Web (`psychologist-app/src/`) | Mobile (`psychologist-mobapp/`) | Фаза |
|---|---|---|
| `store/auth-store.ts` | `lib/store/auth-store.ts` | 0 |
| `hooks/useLanguage.tsx` | `lib/hooks/useLanguage.tsx` | 0 |
| `utils/mood-analytics.ts` | `lib/utils/mood-analytics.ts` | 2 |

### Components

| Web (`psychologist-app/src/`) | Mobile (`psychologist-mobapp/`) | Фаза |
|---|---|---|
| `components/ui/AppLayout.tsx` | `app/(tabs)/_layout.tsx` (tabs) | 0 |
| `components/ui/Sidebar.tsx` | не нужен (табы заменяют sidebar) | — |
| `components/ui/BottomNav.tsx` | `app/(tabs)/_layout.tsx` (native tabs) | 0 |
| `components/ui/ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | 1 |
| `components/ui/ErrorState.tsx` | `components/ErrorState.tsx` | 1 |
| `components/ui/NetworkStatus.tsx` | `components/NetworkStatus.tsx` | 1 |
| `components/ui/ConfirmDialog.tsx` | `components/ConfirmDialog.tsx` | 1 |
| `components/ui/SeverityBadge.tsx` | `components/SeverityBadge.tsx` | 1 |
| `components/ui/StatusBadge.tsx` | `components/StatusBadge.tsx` | 1 |
| `components/student/StudentHeroCard.tsx` | `components/student/StudentHeroCard.tsx` | 2 |
| `components/student/StudentOverviewTab.tsx` | `components/student/StudentOverviewTab.tsx` | 2 |
| `components/student/StudentAssessmentsTab.tsx` | `components/student/StudentAssessmentsTab.tsx` | 2 |
| `components/student/StudentNotesTab.tsx` | `components/student/StudentNotesTab.tsx` | 2 |
| `components/student/MoodSparkline.tsx` | `components/student/MoodSparkline.tsx` | 2 |
| `components/student/ActionMenu.tsx` | `components/student/ActionMenu.tsx` | 2 |
| `index.css` (design tokens) | `global.css` (NativeWind tokens) | 0 |

---

## Зависимости для установки (по фазам)

### Фаза 0
```
nativewind tailwindcss
zustand
clsx
expo-font
```

### Фаза 1
```
@react-native-community/netinfo
```

### Фаза 2
```
(нет новых — используем уже установленные)
```

### Фаза 3
```
expo-notifications
expo-clipboard
```

### Фаза 4
```
react-native-chart-kit  (или victory-native)
expo-file-system
expo-sharing
react-native-svg
```

### Фаза 6
```
expo-haptics (уже есть)
expo-sentry
expo-updates
expo-linking (уже есть)
```

---

## Как работать с этим планом

1. Открываешь новый контекст Claude Code
2. Говоришь: "Работаем по MIGRATION_PSYCHOLOGIST_MOBAPP.md, фаза N"
3. Claude читает этот файл, смотрит что нужно, читает исходники из `psychologist-app`, пишет код в `psychologist-mobapp`
4. По завершении фазы отмечаем `[x]` и обновляем статус
