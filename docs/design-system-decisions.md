# Design System — Decisions Log

Живой документ решений по переносу DS в `psy-app` (web, Vite/React) и `psy-mobapp` (Expo/React Native). Заполняется по ходу grill-сессии. В перспективе — DS будет применяться также к `stu-app`/`stu-mobapp` и лендингу.

**Status:** in progress (grill-сессия 2026-04-29)

**Источники DS:**
- `.handoff/` — Tirek DS (mobile-first iPhone 393×852, brand-specific)
- `.handoff-moon/` — Moon DS (родитель Tirek, web-first dashboard, полный inventory компонентов)

---

## ADR-001 · Темы

**Решение:** только light. Dark не строим. Dark surfaces (`--ink-dark`, `#0F0E1A`) сохраняем как **точечные бренд-моменты** для splash и тёмных hero, не как полноценную dark-тему.

**Почему:**
- Маленький пилот (контекст пилота в школе сестры) — удвоение работы по тестированию состояний без явной потребности.
- `pal(dark)` в `screens.jsx` (handoff) — устаревший эксперимент, не часть финальной DS.
- Moon DS поддерживает dark, но мы его не наследуем для приложений — только базовые токены.

---

## ADR-002 · Базовый brand-цвет

**Решение:** `--brand` = текущий teal psy-app `#0F766E`. Остальная DS (нейтралы, типографика, радиусы, тени, компоненты) — из handoff.

**Производные:**
- `--brand` = `#0F766E` (текущий `--color-primary`)
- `--brand-soft` = `rgba(15, 118, 110, 0.12)`
- `--brand-deep` = `#0A5C56` (текущий `--color-primary-dark`)
- `--brand-fg` = `#FFFFFF`

**Почему:**
- Психологу не нужна свежая бренд-эстетика: нужна **узнаваемость** того, что они уже видели на пилоте.
- Архитектура DS поддерживает смену бренд-тона одной переменной — фиолет/slate/любой другой можно вернуть позже без переделки.
- `data-tone` остаётся как escape hatch.

**Открытые задачи:**
- Аудит psy-app по hardcoded hex и Tailwind цветам (`bg-teal-*`, `text-emerald-*`, и т.д.) — где обходят `var(--color-primary)`.
- `glass-card`, `glow-primary`, `pulse-border` в `index.css` содержат захардкоженные teal-tinted значения. При смене бренда они отстанут — переписать через токены либо удалить.

---

## ADR-003 · Семантические цвета

**Решение:** гибрид (вариант D из grill).

| Роль | Hex | Источник |
|---|---|---|
| `--success` | `#16794A` | Текущий psy-app (приглушённый зелёный, **визуально отличается от brand-teal**) |
| `--warning` | `#FFB319` | DS Moon/Tirek (живой жёлтый — сигнал) |
| `--danger` | `#FF4E64` | DS Moon/Tirek (живой red — кризисная лента, риск-индикаторы) |
| `--info` | `#8ACFDE` | DS Moon |

**Почему:**
- **Success — приглушённый.** «Всё ок» не должно цеплять глаз. И решает конфликт teal-brand vs teal-success.
- **Warning/Danger — живые.** Жёлтая лента «требует внимания» (mid-risk) и красная кризисная — в этом приложении это **самый критичный сигнал**, экономить на яркости нельзя.

---

## ADR-004 · Источник правды DS

**Решение:** двухслойная архитектура.

```
.handoff-moon/        ← Moon DS как foundation: токены, 30+ компонентов, light+dark
.handoff/             ← Tirek mobile-overlay: переопределяет геометрию для mobile
```

В коде:
```css
/* moon-tokens.css — base */
:root { --radius-md: 8px; --control-h-md: 40px; ... }

/* tirek-mobile-overlay.css — наследует, переопределяет под mobile */
[data-density="mobile"] {
  --radius-md: 14px;
  --control-h-md: 54px;
}
```

- `psy-app` (web/dashboard): Moon-density (radius 8, control 40) — без `data-density`.
- `psy-mobapp` (RN): Tirek-density (radius 14, control 54) — `data-density="mobile"` на root (или эквивалент в RN).
- Лендинг: web-density.
- `stu-app`/`stu-mobapp` в будущем: тот же base + override `--brand-*` под детский тон.

**Почему:**
- Moon описывает 30+ компонентов с состояниями (Tabs, Table, Modal, Drawer, Switch, ...). Дублировать вручную — недели.
- Tirek-овские mobile-размеры (radius 14, control 54) выведены из iOS HIG, не вкусовое.
- Меняем геометрию через одну переменную — DS уже строится на этой идее (`data-tone`).

---

## ADR-005 · Что из Tirek-расширений сохраняем

| Tirek-расширение | Решение | Комментарий |
|---|---|---|
| `--shadow-cta` (brand-tinted glow на CTA) | ✅ keep | Бренд-момент, отличает Tirek от generic Moon |
| `--brand-deep` (тёмная вариация brand) | ✅ keep | Полезен для текста на тёмных surface |
| `data-tone` (purple/slate/teal switch) | ✅ keep | Escape hatch если бренд-тон изменится. Не используется сейчас, но архитектурно есть |
| `Caveat` font (display accent) | 🔻 убираем из @import | Чат явно зафиксировал: «на финальных экранах не появляется». Если для лендинга понадобится — вернём |
| splash «moon-glow» (radial-gradient over ink-dark) | ❌ remove | Tirek отказался от лунной метафоры. Splash = `tirek.` wordmark на тёмном фоне без glow |

---

## ADR-006 · Иконки

**Решение:** Lucide.

**Источник:** Moon DS прямо рекомендует Lucide как substitute (`https://unpkg.com/lucide@latest`, 24×24, 2px stroke, square caps). В psy-app/screens.jsx (handoff) уже использовался такой стиль.

**Открытые вопросы (отложено):** конкретный механизм подключения в web vs RN — обсудим в фазе переноса.

---

## ADR-007 · Типографика — одна шкала на всех платформах

**Решение:** одна типо-шкала Moon DS, без отдельной mobile-шкалы.

| Token | Size / line-height | Назначение |
|---|---|---|
| `--text-display` | 72/76 | Hero лендинга. На mobile/dashboard не используется |
| `--text-h1` | 48/56 | Hero-заголовки |
| `--text-h2` | 32/40 | Заголовки экранов |
| `--text-h3` | 24/32 | Подразделы |
| `--text-h4` | 20/28 | Карточки, заголовки списков |
| `--text-md` | 16/24 | Body large, кнопки |
| `--text-sm` | 14/20 | Body (primary), UI |
| `--text-xs` | 12/16 | Captions, помощь под полями |
| `--text-2xs` | 10/14 | Labels (UPPER), eyebrows |

**Шрифты:** Inter везде (см. ADR-008).

**Почему:**
- Шкала Moon и шкала Tirek почти идентичны (отличаются только display 72 vs 64) — заводить два варианта = сложность без смысла.
- Двухслойность DS (ADR-004) — про **геометрию контролов** (iOS HIG 44px touch min), не про типографику. 14px остаётся 14px на любом устройстве.
- На mobile display 72 не используется естественно — нет места.

**Открытое:** Tailwind classes (`text-sm`, `text-xs`) в psy-app — **третья** шкала, которую надо подружить с CSS-переменными. Решение в фазе переноса.

---

## ADR-008 · Шрифты — Inter везде, DM Sans отбрасываем

**Решение:** один шрифт **Inter** для UI, заголовков и body. DM Sans убираем из @import.

**Почему:**
- DM Sans в psy-app использовался бы редко: основная поверхность — списки/карточки/таблицы, а не длинные тексты для чтения 5+ минут.
- Один шрифт = меньше cold-start overhead на mobile.
- Inter поддерживается официальным `@expo-google-fonts/inter` — нативный путь без возни с ttf-файлами.
- На stu-* при необходимости можно будет заменить Inter на другой UI-шрифт (Nunito, Atkinson Hyperlegible) одной переменной.

**Загрузка:**
- **psy-app (web/Vite)**: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')` — как сейчас в handoff.
- **psy-mobapp (Expo/RN)**: `@expo-google-fonts/inter` + `useFonts()` + блокировать SplashScreen до загрузки.

**Fallback chain:**
```
"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

**Если потом для лендинга понадобится DM Sans** — добавим обратно как опцию, не как обязательную базу.

**`--font-paragraph` token** — оставляем переменную как алиас на Inter, чтобы при необходимости можно было быстро ввести второй шрифт без переписывания компонентов.

---

## ADR-009 · Voice (тон копирайта)

**Решение:** Tirek voice как есть.

- Спокойный, ясный, без пафоса.
- Без эмодзи в UI (`🎉`, `🚀`, `💪`, `✨`...).
- Минимум восклицательных знаков.
- Никаких «давайте начнём наше путешествие», «Готово!», «Отлично!», «Поздравляем!».
- Sentence case для заголовков, не Title Case.
- Интерфейс помогает работать, не «помогать чувствовать».

**Почему:**
- Психолог в школе живёт между подростком и системой — нужен профессиональный инструмент, не подростковый сервис.
- Текущий psy-app уже соответствует (быстрый grep на эмодзи и пафосные конструкции — пусто).

**Применение:** при любом новом копирайте + при переписывании экранов под DS. Voice — не блокер для переноса, точечные правки в i18n по мере встречи.

---

## Сводка ADR-001..009 (DS-фундамент закрыт)

| # | Решение |
|---|---|
| 001 | Только light, без dark |
| 002 | `--brand` = `#0F766E` (текущий teal psy-app), остальные нейтралы/семантика из DS |
| 003 | Семантика: success `#16794A` (текущий приглушённый), warning `#FFB319` + danger `#FF4E64` (DS живые) |
| 004 | Двухслойная: Moon DS как foundation + Tirek mobile-overlay через `data-density="mobile"` |
| 005 | Из Tirek-расширений: keep `--shadow-cta`, `--brand-deep`, `data-tone`; remove splash-glow, Caveat |
| 006 | Иконки: Lucide (24×24, 2px stroke) |
| 007 | Одна типо-шкала Moon на всех платформах |
| 008 | Inter везде (DM Sans отбрасываем) |
| 009 | Voice: Tirek (спокойный, без эмодзи, без пафоса) |

---

## ADR-010 · Источник правды токенов и façade в существующих апах

**Решение:** гибрид (D+B).

**1. Источник правды:** `packages/shared/src/design-system/`
- Единый JS-объект `tokens` (colors, spacing, radius, typography, shadows, motion).
- Из него генерируется `tokens.css` для web (`:root { --brand: #0F766E; ... }`) — либо build-step (export), либо ручная синхронизация (см. открытые вопросы).
- На mobile импортируется напрямую как ESM-модуль.
- Поверх этого объекта — overlay через `density: "web" | "mobile"` (ADR-004): один и тот же объект, но при выборе density возвращает другие значения геометрии.

**2. mobapp façade:** `packages/psychologist-mobapp/lib/theme/`
- Файлы (`colors.ts`, `spacing.ts`, `typography.ts`, `shadows.ts`, `ThemeProvider.tsx`) **остаются на месте** — компоненты не ломаются.
- Внутри они **переписываются** под `@tirek/shared/design-system`.
- Старые ключи (`colors.primary`, `colors.bg`, `colors.surface`, `colors.success`, ...) — алиасы на DS-токены:
  - `primary` → `brand`
  - `primaryDark` → `brand-deep`
  - `bg` → `bg`
  - `surface` → `surface`
  - `text` → `ink`
  - `textLight` → `ink-muted`
  - `border` → `hairline`
  - `success/warning/danger/info` — по ADR-003 (success-приглушённый текущий, warning/danger из DS)
- `darkColors` **удаляется** (ADR-001), `ThemeProvider` упрощается до single-light. AsyncStorage-логика темы выкидывается.
- `typography.ts` переписывается под Moon-шкалу (ADR-007): h1=48/56, h2=32/40, h3=24/32, h4=20/28, body-md=16/24, body-sm=14/20, body-xs=12/16. Текущие h1=24/h2=18/h3=16 — это стайл `h3/h4/body-lg` в DS-неймнге.

**3. psy-app web:** `packages/psychologist-app/src/index.css`
- `:root { --brand: ...; ... }` — генерируется из shared (не дублируется руками).
- `@theme` (Tailwind v4) маппится на `var(--*)`, чтобы Tailwind-классы продолжали работать. Подробнее — следующий ADR.
- `glass-card`, `glow-primary`, `pulse-border` — переписываются через токены (либо удаляются, см. открытые задачи).

**4. Миграция компонентов:** постепенная, не блокер.
- Façade означает что компоненты будут работать **и до миграции, и после**. Можно идти screen-by-screen или component-by-component.
- Tokens-фасад первой очереди делает **визуальные изменения сразу видимыми** (тени, success-цвет, типографика поменяются на всех экранах одновременно — это и есть "DS перенесена").

**Почему гибрид:**
- **D** даёт архитектурно правильный единый источник для psy-app + psy-mobapp + лендинг + stu-* в перспективе.
- **B** снимает шок миграции — компоненты не падают в момент.
- **A** (полная замена ключей в façade) слишком дорого: N экранов читают `useThemeColors()` сейчас.
- **C** (deprecated + новые имена живут параллельно) растягивает технический долг.

---

## ADR-011 · Web (psy-app): Tailwind v4 + `@theme` маппит на DS-токены

**Решение:** на web фокус минимальный — это одна задача по обновлению Tailwind config, не архитектурный ворк.

**Что делаем:**
- В `packages/psychologist-app/src/index.css`: `@theme { --color-brand: var(--brand); --color-ink: var(--ink); --color-bg: var(--bg); ... }` — маппинг DS-токенов на Tailwind tokens v4.
- `:root { --brand: #0F766E; ... }` генерируется/копируется из `@tirek/shared/design-system`.
- Tailwind utility-классы (`bg-brand`, `text-ink`, `rounded-lg`) продолжают работать, теперь берут значения из DS.
- `glass-card`, `glow-primary`, `pulse-border` — остаются, но если что-то теряет смысл при смене бренда — поправим точечно (не блокер).
- Существующие страницы **не переписываются** — меняются только имена цветов (`bg-teal-600` → `bg-brand` и т.д.) точечно по мере встречи.
- DS-классы (`.btn .btn--primary`, `.card`, `.pill`) в web **не используем** — на web всё через Tailwind utilities.

**Что не делаем:**
- Не отказываемся от Tailwind.
- Не вводим параллельный набор DS-классов в CSS.
- Не переписываем экраны массово.

**Дальше веб не грилим** — это одна PR-задача. Фокус grill переходит на mobapp, где архитектурный ворк нетривиальный.

---

## ADR-012 · Mobapp layout: DS-компоненты в shared + StyleSheet для остального

**Решение:** (D+A) — высокоуровневые DS-компоненты как готовые блоки, StyleSheet API для всего остального. Никаких `<Box>`/`<Stack>` обёрток, никакого Tamagui/Restyle/Unistyles.

**Что делаем:**
- В `packages/shared/src/components/native/` — пакет переиспользуемых компонентов:
  - `<Button>` (variants: primary, ghost, on-dark; sizes: sm/md/lg/xl)
  - `<Card>` (variants: default, floating)
  - `<Input>` (states: default, focus, error)
  - `<Pill>` (variants: brand, success, warning, danger)
  - `<ListItem>` (стандартный list-row)
  - `<Sheet>` (bottom sheet, sheet-over-hero)
  - `<H1>/<H2>/<H3>/<H4>/<Body>/<Caption>/<Eyebrow>/<Label>` — типографические компоненты
- Каждый компонент читает токены из `@tirek/shared/design-system` (ADR-010).
- Stu-mobapp в перспективе использует те же компоненты, отличается только `--brand-*`.

**Что НЕ делаем:**
- Не вводим `<Box bg p radius>` обёртки — это путь к собственному мини-фреймворку.
- Не подключаем Tamagui/Restyle/Unistyles — новая dependency без явной потребности.
- Не пишем NativeWind (см. `feedback_no_nativewind`).

**Layout остаётся на StyleSheet:**
```tsx
const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
});
```
Где `spacing.lg` импортируется из shared-tokens.

**Почему:**
- 80% повторов решает 6 готовых компонентов (Button, Card, Input, Pill, ListItem, Sheet).
- StyleSheet нативен для RN, нет runtime overhead, не нужно учить новый API.
- Компонентная абстракция = React-компонент, не CSS-класс. Это согласуется с web (ADR-011).
- `lib/theme/` façade в mobapp (ADR-010) остаётся, но шире не разрастается.

---

## ADR-013 · Иконки — не часть DS, лучшее под платформу

**Решение:** иконки — implementation detail, не закрепляются в DS.

- **psy-app (web):** `lucide-react` (уже стоит).
- **psy-mobapp (RN):** что окажется удобнее в коде. По умолчанию пробуем `lucide-react-native` (тот же визуальный язык что и web), но ничто не запрещает использовать `@expo/vector-icons` (уже стоит) или inline SVG для бренд-моментов.

DS фиксирует только размер (24×24 default) и stroke (2px) как **базовый визуальный стиль**, без требования к конкретной библиотеке. ADR-006 пересматривается — Lucide убираем как **обязательный** источник, остаётся как **рекомендация**.

---

## ADR-014 · Navigation: оставляем react-navigation bottom-tabs, минимальные правки

**Решение:** keep текущий `app/(tabs)/_layout.tsx` как есть. DS не диктует механику tab-bar, только визуал.

**Минимальные правки:**
- `tabBarLabelStyle.fontFamily: "DMSans-SemiBold"` → `Inter-SemiBold` (ADR-008).
- Цвета через `useThemeColors()` автоматически перейдут на DS-токены через façade (ADR-010): `c.primary` → `--brand`, `c.danger` → `--danger` (FF4E64, ADR-003).
- Высота 56, badge на crisis/messages — оставляем.

**Что НЕ делаем:**
- Не пишем `<DSTabBar>` в shared — overengineering. Stu-mobapp скопирует свой `_layout.tsx` с другим содержимым табов.
- Не переписываем на кастомный tab-bar из `screens.jsx` handoff — теряем нативное iOS-поведение (haptic, swipe).

**Visual change after migration:** crisis-бэйдж станет заметнее (приглушённый `#B33B3B` → живой `#FF4E64`). Это намеренно — кризис должен бросаться в глаза.

---

## ADR-015 · Шрифт Inter в RN — `@expo-google-fonts/inter`

**Решение:** грузим Inter через `@expo-google-fonts/inter` + `useFonts()` + блокировка SplashScreen в `app/_layout.tsx`.

**Веса:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold). Достаточно для всех вариантов в ADR-007.

**Что делаем при миграции:**
1. `pnpm add @expo-google-fonts/inter expo-splash-screen`
2. В `app/_layout.tsx`:
   - `SplashScreen.preventAutoHideAsync()` до рендера
   - `useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })`
   - `if (!loaded) return null`
   - После загрузки — `SplashScreen.hideAsync()`
3. В `lib/theme/typography.ts`: `fontFamily: "Inter_400Regular"` / `"Inter_500Medium"` / etc.
4. Все ссылки на `DMSans-SemiBold` (например в `(tabs)/_layout.tsx`) → `Inter_600SemiBold`.

**Текущее состояние (на момент grill-сессии):** `useFonts` не вызывается нигде, `DMSans-SemiBold` указан, но не загружен — mobapp фактически работает на system-default font (SF Pro iOS / Roboto Android). При миграции **ничего не ломается**, просто впервые корректно начнёт грузиться кастомный шрифт.

**Cost:** ~200KB bundle, ~50-150ms cold start. Принято.

---

## ADR-016 · Состояния (skeleton/empty/error) — определяем на месте

**Решение:** не закладываем общие компоненты заранее. При миграции конкретного экрана решаем по ситуации — пишем skeleton/empty/error руками с DS-токенами.

**Что НЕ делаем:** не создаём `<Skeleton>`, `<EmptyState>`, `<ErrorView>` в shared заранее. Не пишем правила в ADR.

**Принимаемый риск:** разнобой между экранами. Если по ходу заметим, что один и тот же паттерн повторяется на 3+ экранах — выносим в shared **тогда**, а не превентивно.

**`<NetworkStatus>` (offline indicator)** — уже существует в `components/NetworkStatus.tsx`, остаётся как есть, цвета через façade (ADR-010).

---

## ADR-017 · Полное удаление dark theme из mobapp

**Решение:** dark theme выкидывается полностью из `lib/theme/`. ThemeProvider становится тривиальным.

**Что удаляем:**
- `darkColors` из `colors.ts`
- `useColorScheme()` из `ThemeProvider.tsx`
- `AsyncStorage` логика для сохранения theme mode
- `mode` / `setMode` из ThemeContext
- `isDark` из ThemeContext
- В `_layout.tsx`: `<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />` → `<StatusBar barStyle="dark-content" />`

**Что остаётся:**
- `lightColors` (переименовать в просто `colors` или `tokens` — на момент имплементации)
- `useThemeColors()` hook — продолжает работать как façade (ADR-010), просто всегда возвращает light-токены
- Splash-screen с тёмным фоном (`--ink-dark`) — локально выставляет `<StatusBar style="light" />`, без global theme-aware логики

**Принимаемый trade-off:** если потом понадобится dark — придётся вернуть инфраструктуру за ~час работы. Это дешевле, чем держать dead code, который выглядит как фича.

---

## ADR-018 · Pipeline компонентов и smoke-test

**Решение принято автономно (грилли согласился делегировать архитектурные мелочи):**

**Pipeline (mobapp):** Button → Typography pack (H1/H2/H3/H4/Body/Caption) → Card → Pill → Input → Sheet.

**Smoke-test:** первый Button мигрируется через `LoginPage` (там CTA самый видимый). Если архитектура (`@tirek/shared/components/native/` + `lib/theme/` façade + Inter + StyleSheet) работает на Button — миграция принимается, продолжаем pipeline.

**По одному PR на компонент.** Каждый PR =
1. Компонент в `shared/components/native/`
2. 1-2 экрана-потребителя мигрированы
3. Façade в `lib/theme/` обновлён если требуется

**Если на smoke-test что-то ломается** — лечим на месте, ADR-010..015 могут пересматриваться.

---

## ADR-019 · ПРАВИЛО МИГРАЦИИ: только перекрашиваем, фичи не трогаем

**Решение:** перенос DS = **визуальная миграция**, не продуктовая.

**Что разрешено:**
- ✅ Замена цветов на DS-токены (через façade ADR-010).
- ✅ Замена радиусов, теней, шрифтов на DS.
- ✅ Замена кастомных Pressable/Touchable на `<Button>` из shared (ADR-018).
- ✅ Изменение layout, если он явно ломает DS-паттерн (например, login → split-screen с hero, ADR-020).
- ✅ Подсветить как отдельный вопрос, если что-то выглядит странно. **Не вырезать молча.**

**Что запрещено:**
- ❌ Удалять существующие фичи (language switch, eye-toggle, error-banner, шаги onboarding и т.д.).
- ❌ Добавлять новые фичи (SSO, биометрия и т.д.) — это отдельные задачи, не миграция.
- ❌ Вырезать "странные" экраны (типа 8-шагового onboarding) даже если они кажутся лишними по `feedback_feature_is_obligation`.

**Принцип:** каждый существующий экран после миграции = **тот же экран в DS-визуале**, не «улучшенная версия».

---

## ADR-021 · Mood-индикатор (1-5) — 5-сегментная шкала, не emoji

**Решение:** в **компактных контекстах** (список учеников, ListItem) заменяем emoji `😢/😟/😐/😊/🤩` на 5-сегментную горизонтальную шкалу.

**Визуал:**
- 5 сегментов горизонтально, ширина каждого ~6px, gap 2px (общая ширина ~38px).
- Радиус: `--radius-xs` (4px) на каждом сегменте.
- Активные сегменты: `--brand` (текущий teal), все одного цвета.
- Неактивные: `--hairline`.
- Уровень N = N заполненных сегментов слева, остальные пустые.
- ARIA-label: «настроение N из 5».

**Цветовая схема намеренно НЕ-семантическая:**
- Не используем red/yellow/green в индикаторе.
- Это критично, чтобы **не смешивать** с риск-сигналами (red/yellow ленты на дашборде).
- Психолог не должен путать «низкое настроение сегодня» с «кризисный риск».

**Где применяется:**
- StudentsList (`(tabs)/students.tsx`): замена `moodEmojis` map.
- StudentDetail (`(screens)/students/[id].tsx`): в кратком header — шкала. **MoodSparkline (график за 7 дней) остаётся как есть** — это другая визуализация для другого контекста (см. `feedback_mood_visualization`).
- В web psy-app (по `feedback_mobapp_in_visualization_scope` — UI/visualization issues включают и web): аналогичная шкала в `StudentsListPage`.

**Компонент в shared:** `<MoodScale value={1-5} />` — кладём в `@tirek/shared/components` как универсальную шкалу 1-5. Может переиспользоваться, например, для оценки риска и других уровневых индикаторов.

**Что трогаем у emoji:** удаляем `moodEmojis` map из `(tabs)/students.tsx` и `[id].tsx`, заменяем на `<MoodScale>`. **Это исключение из правила ADR-019** — мы перекрашиваем, а не вырезаем фичу. Mood **остаётся** в UI, меняется только его визуальное представление. Согласовано.

---

## ADR-020 · LoginPage (mobapp) — split-screen, тёмный hero

**Решение:** переделываем под Tirek handoff direction A — sheet-over-hero.

**Структура:**
- **Верх (hero ~280px):** фон `--ink-dark` (#0F0E1A), wordmark `tirek.` белым по центру, subtitle «опора» каже-то ниже (или в hero, на твоё усмотрение). Language switch (RU/KZ) располагаем в hero (на тёмном фоне) — освобождает форму.
- **Низ (sheet, flex:1):** белый surface, скруглён сверху на `--radius-3xl` (32px), pulled up over hero. Внутри: email/password inputs, forgot-password link, primary CTA «Войти», под кнопкой — ссылка на регистрацию.

**Без splash «moon-glow»** (ADR-005). Просто `--ink-dark` равномерным фоном.

**Smoke-test pipeline (ADR-018):** этот экран будет потребителем первого мигрированного компонента — `<Button>`.

**Visual change:** error-banner (`backgroundColor: rgba(179,59,59,0.08)`) станет `var(--danger-soft)` с живым `#FF4E64` (ADR-003) — заметнее.

---

## Открытые ветки grill (в процессе) — ВЕТКА 3: ЭКРАНЫ

- [x] RegisterPage: split-screen по аналогии с Login (ADR-020). Без отдельного ADR.
- [x] OnboardingPage: 8 шагов остаются (ADR-019), 7 разноцветных иконок → `--brand`.
- [x] DashboardPage: migrate as-is. Greeting h1=24 → DS-H3 (24/32). Структура совпадает с `project_main_screen_priorities`.
- [x] StudentsList: миграция as-is + замена mood emoji на 5-сегментную шкалу (см. ADR-021).
- [x] StudentDetail: migrate as-is. Хардкод hex в `statusRingColors` → через façade. DMSans → Inter. Ring у `attention` станет ярче (живой `#FFB319` вместо охры). MoodSparkline остаётся.
- [x] CrisisPage: migrate as-is. Через façade red станет живой `#FF4E64` — это намеренно (кризис должен бросаться в глаза). `pulse-border` анимацию для critical alerts не добавляем (не описана в DS, отдельная задача если понадобится).
- [x] DiagnosticsPage: migrate as-is. Локальный `SegmentBtn` остаётся, в shared не извлекаем. Если потом такой же паттерн появится ещё в 2 местах и они сойдутся — вынесем тогда (rule of three).
- [x] MessagesPage + DirectChat: migrate as-is. По `project_messages_model` — без typing, асимметричные read receipts. Структура не меняется.
- [x] **Все оставшиеся экраны** (`profile`, `office-hours`, `diagnostics/assign-class`, `diagnostics/assign-student`, `diagnostics/test/[slug]`, `messages/[conversationId]`): migrate as-is через façade. Если по ходу встретится спорное — подсвечиваем в момент миграции, не превентивно.

---

## Финальный roadmap (PR pipeline)

### Foundation (PR 1-3)
1. **PR 1 · Foundation tokens.** `packages/shared/src/design-system/` — JS-объект токенов (colors/spacing/radius/typography/shadows/motion). Inter via `@expo-google-fonts/inter`. ADR-002, 003, 005, 007, 008, 010.
2. **PR 2 · psy-app web Tailwind config.** `index.css` обновляется: `:root { --brand: ... }` + `@theme` маппит на DS-токены. Существующие страницы продолжают работать, цвета постепенно обновятся через переименование. ADR-011.
3. **PR 3 · mobapp façade refactor.** `lib/theme/colors.ts` переписывается под shared-tokens, `darkColors` удаляется, `ThemeProvider` упрощается, `typography.ts` → Inter, `(tabs)/_layout.tsx` font fix. ADR-010, 014, 015, 017.

### Components (PR 4-9)
4. **PR 4 · `<Button>` + smoke-test.** Компонент в shared, мигрирован LoginPage (ADR-020). Это smoke-test всей архитектуры. ADR-018.
5. **PR 5 · Typography pack** (H1/H2/H3/H4/Body/Caption + Eyebrow/Label).
6. **PR 6 · `<Card>`** (variants: default, floating).
7. **PR 7 · `<Pill>`** (variants: brand, success, warning, danger).
8. **PR 8 · `<Input>`** (states: default, focus, error).
9. **PR 9 · `<Sheet>`** (bottom sheet, sheet-over-hero).

### Screens (PR 10+, по одному на экран)
10. **PR 10 · LoginPage + RegisterPage** (split-screen с тёмным hero, ADR-020).
11. **PR 11 · OnboardingPage** (8 шагов keep, 7 цветов → `--brand`).
12. **PR 12 · DashboardPage** (как в `project_main_screen_priorities`).
13. **PR 13 · StudentsList + `<MoodScale>` компонент** (ADR-021).
14. **PR 14 · StudentDetail** (`StudentHeroCard` фикс, `<MoodScale>` в header, MoodSparkline keep).
15. **PR 15 · CrisisPage**.
16. **PR 16 · DiagnosticsPage** (3 сегмента, локальный `SegmentBtn`, sub-screens assign/test).
17. **PR 17 · MessagesPage + DirectChat**.
18. **PR 18 · ProfilePage + OfficeHoursPage**.

### After (опционально)
- **psy-app web страницы** — миграция точечно по мере встречи, не блокируется.
- **stu-app / stu-mobapp** — отдельный проект, переиспользует foundation + другой `--brand-*`.

---

## Сводка ADR (010..021)

| # | Что |
|---|---|
| 010 | Источник правды токенов: `@tirek/shared/design-system`, façade в mobapp `lib/theme/`, `:root` в psy-app web |
| 011 | Web psy-app: Tailwind v4 `@theme` маппит на DS-токены, не отдельный layer |
| 012 | Mobapp: DS-компоненты в shared + StyleSheet для остального |
| 013 | Иконки — implementation detail, не часть DS |
| 014 | Navigation: react-navigation bottom-tabs, минимальные правки |
| 015 | Шрифт Inter в RN — `@expo-google-fonts/inter` |
| 016 | skeleton/empty/error — определяем на месте |
| 017 | Полное удаление dark theme |
| 018 | Pipeline компонентов + smoke-test через Login |
| 019 | **Правило миграции:** только перекрашиваем, фичи не трогаем |
| 020 | LoginPage — split-screen с тёмным hero |
| 021 | Mood-индикатор → 5-сегментная шкала, не emoji |

---

## Открытые задачи (внутри PR-ов)

- Аудит psy-app по hardcoded hex и Tailwind цветам — где обходят `var(--color-primary)` (PR 2).
- `glass-card`, `glow-primary`, `pulse-border` в `index.css` — keep / refactor через токены (PR 2).
- Удаление `Caveat` из @import (PR 1).
- [ ] OnboardingPage (mobapp): нужен ли вообще? сейчас он что-то делает?
- [ ] DashboardPage (mobapp): главный экран — статус кризисов, монитор. Какие приоритеты в иерархии?
- [ ] StudentsListPage: Active/Pending сегменты есть в memory, как они выглядят на DS?
- [ ] StudentDetail: единый скролл по memory, action bar в шапке — как DS-овски?
- [ ] CrisisPage: красная/жёлтая лента — самый критичный визуал, нужен особенный контраст?
- [ ] DiagnosticsPage: 3 сегмента (Каталог/Назначения/Результаты) — как выглядит segmented-control в DS?
- [ ] Messages-list / DirectChatPage: pair chats, без typing — как будут выглядеть?
- [ ] OfficeHoursPage: weekly template + override (только что merged) — UI правок в DS требует?
- [ ] ProfilePage: drawer (по memory IA) — как организован?
- [ ] Какой экран mobapp перенесём первым (smoke-test для архитектуры)
- [ ] Состояния: skeleton, empty, error — в DS их нет, придётся определять
- [ ] Шрифт Inter в RN: `@expo-google-fonts/inter` + блокировка SplashScreen
- [ ] Удаление `darkColors` + AsyncStorage theme-mode из ThemeProvider
- [ ] Работа с `safe-area-inset` + status-bar/home-indicator (handoff предполагает 393×852 iPhone)
- [ ] Какие компоненты пишем в первую очередь: typography → Button → Card → Input → Pill → Sheet?
