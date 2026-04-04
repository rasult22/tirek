# Тестовые аккаунты Tirek

## Психолог
- **URL:** http://localhost:5174
- **Email:** psychologist@tirek.kz
- **Пароль:** demo123456
- **Имя:** Айгуль Нурланова

## Ученик
- **URL:** http://localhost:5173
- **Email:** student@tirek.kz
- **Пароль:** student123
- **Имя:** Алихан Ерболов
- **Класс:** 9 "А"

## Запуск

```bash
docker compose up -d            # PostgreSQL
npm run dev:backend              # API :3001
npm run dev:student              # Ученик :5173
npm run dev:psychologist         # Психолог :5174
```
