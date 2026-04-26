# @tirek/shared/api — Tirek API Client

Единый HTTP-клиент для общения с Tirek backend. Используется во всех 4 апп-пакетах (`student-app`, `student-mobapp`, `psychologist-app`, `psychologist-mobapp`).

## Зачем

До этого пакета каждый из 4 frontend-пакетов держал свою копию fetch-функций. При изменении endpoint'а на backend нужно было править 4 файла → высокий риск drift'а. Теперь backend меняет contract → правки в одном месте.

## Использование

```ts
import { createTirekClient } from "@tirek/shared/api";

const client = createTirekClient({
  baseUrl: "http://localhost:3001",
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    window.location.href = "/login"; // или router.replace("/login") в Expo
  },
});

const entry = await client.mood.create({ mood: 4 });
const insights = await client.mood.insights();
const students = await client.psychologist.students.list({ grade: 9 });
```

### Платформенная инициализация

Каждый апп-пакет создаёт свой singleton в `api/client.ts`:
- web: `import.meta.env.VITE_API_URL`, `window.location.href` для redirect
- Expo: `process.env.EXPO_PUBLIC_API_URL`, `router.replace()` для redirect

Storage токена injectится через `getToken: () => string | null` callback. Shared client про Zustand/expo-secure-store/localStorage ничего не знает.

## Как добавить новый endpoint

1. Добавить метод в `TirekClient` interface (`packages/shared/src/api/index.ts`).
2. Добавить реализацию в `createTirekClient` — должна совпадать с реальным backend route (URL, method, body shape).
3. Если новый endpoint затрагивает тип ответа, не описанный в `shared/types/` — добавить туда сначала.
4. Добавить тонкий re-export в нужных апп-пакетах (если нужно сохранить старое имя): `export const fooApi = tirekClient.foo;`.
5. (Желательно) добавить integration-тест в `packages/backend/src/api-client/api-client.test.ts`, проверяющий URL/method/body.

## Особые случаи

- **CSV-export** — endpoint'ы возвращают raw CSV, не JSON. Метод `psychologist.export.studentCsvUrl(id)` возвращает только URL; саму загрузку каждый пакет делает по-своему (web — blob+download, Expo — file system + Sharing).
- **SSE streaming** — `chat.streamMessage()` возвращает raw `Response` (без JSON-парсинга), 401 в этом потоке не вызывает `onUnauthorized` — caller обрабатывает сам.

## Тесты

Integration-тесты идут через in-process Hono `app.fetch` — реальный fetch loop без mock'а сетевого слоя:

```bash
cd packages/backend && npm test -- src/api-client
```
