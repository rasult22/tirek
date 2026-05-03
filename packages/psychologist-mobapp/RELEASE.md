# Релиз psy-mobapp в App Store / Play Store

Шпаргалка по EAS для билдов и сабмита.

## Один раз: установка

```bash
npm install -g eas-cli
eas login
```

## Контекст проекта

| Поле | Значение |
|---|---|
| Expo project | `@rasult22/tirek-psychologist` |
| Expo projectId | `2118bdc4-a3a5-43e5-b294-68c2d9c35448` |
| iOS bundle id | `kz.tirek.psychologist` |
| Android package | `kz.tirek.psychologist` |
| Apple Team | `P2U5889L35` |
| Push key (Apple) | `4V63LK58J2` |

Все credentials (distribution cert, provisioning profile, APNS push key) лежат на серверах Expo, привязаны к projectId. Локально хранить ничего не нужно.

## Версирование

- `version` в `app.json` — marketing-версия, видна в App Store. Бампать руками при релизе (`1.0.0` → `1.0.1`).
- `buildNumber` (iOS) / `versionCode` (Android) — `eas.json` имеет `appVersionSource: "remote"` + `autoIncrement: true` в production-профиле. EAS сам инкрементирует на каждом билде, локальные значения в `app.json` игнорируются.

## Билд

### Production (для App Store / TestFlight)

```bash
cd packages/psychologist-mobapp
eas build -p ios --profile production
```

- Билд на серверах Expo (~15-20 мин)
- Подписан distribution cert + provisioning profile
- Результат: ссылка на `.ipa` в выводе CLI и на expo.dev → Builds

### Скачать IPA

```bash
eas build:list --platform ios --limit 1
```

Покажет последний билд со ссылкой на скачивание. Либо открыть expo.dev → Project → Builds → нужный билд → "Download".

### Preview / Internal (для тестирования без TestFlight)

```bash
eas build -p ios --profile preview
```

Не для App Store — только для установки на устройства, зарегистрированные в provisioning profile (через `eas device:create`).

### Android

```bash
eas build -p android --profile production
```

Выдаёт `.aab` (App Bundle для Play Store) или `.apk` зависит от настроек профиля.

## Сабмит в App Store Connect

```bash
eas submit -p ios --latest
```

- `--latest` берёт последний production-билд автоматически
- Можно явно: `eas submit -p ios --id <buildId>`
- Спросит App Store Connect API key или Apple ID при первом запуске — выбрать App Store Connect API key (надёжнее)
- Загрузка ~5-10 мин, потом Apple processing ~10-30 мин

После этого билд появится в App Store Connect → My Apps → Tirek Psychologist → TestFlight.

### Создание API key (один раз)

1. appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API
2. Generate API Key → Access: Admin
3. Скачать `.p8` файл (один раз)
4. Записать Issuer ID и Key ID
5. На первом `eas submit` ввести эти три значения — EAS их сохранит

## Сабмит в Play Store

```bash
eas submit -p android --latest
```

Требует service account JSON от Google Play Console (создаётся в Google Cloud Console → IAM → Service Accounts).

## OTA обновления (без релиза в стор)

Для JS-only изменений (без правок в нативном коде / app.json):

```bash
eas update --channel production --message "fix typo"
```

- Доставится пользователям в течение нескольких минут
- Привязано к `runtimeVersion` (= `version` из `app.json`), поэтому работает только для билдов с той же marketing-версией
- Если меняешь native code или плагины — нужен новый билд через стор

## Workflow для нового релиза

1. Поднять `version` в `app.json` (`1.0.0` → `1.1.0`)
2. `eas build -p ios --profile production` (autoIncrement bump'нет buildNumber)
3. `eas submit -p ios --latest`
4. Дождаться processing в App Store Connect
5. В TestFlight добавить build в Test Group → раздать тестерам
6. Когда готов — App Store Connect → App Store → Submit for Review

## Отладка credentials

```bash
eas credentials              # интерактивное меню
eas credentials -p ios       # сразу iOS
```

Если что-то сломалось:
- "Remove credentials" → пересоздать через "Set up all required credentials"
- Push key и distribution cert можно регенерировать без перевыпуска приложения

## Полезные ссылки

- expo.dev → Projects → tirek-psychologist (билды, аналитика, OTA updates)
- developer.apple.com → Account → Certificates, Identifiers & Profiles
- appstoreconnect.apple.com → My Apps (метаданные, скрины, submit for review)
- docs.expo.dev/submit/introduction
- docs.expo.dev/eas-update/introduction
