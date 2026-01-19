# AssetPredict

AssetPredict — веб-приложение для прогноза временных рядов цен активов (акции, FX, крипто).
Дашборд строит прогнозы и интервальные оценки и сохраняет историю запросов пользователя.
Логика разделена на лёгкую предобработку в браузере и серверный API для работы с пользовательскими данными.

## Возможности

- Прогнозирование и визуализация временных рядов в одном интерфейсе.
- Интервальные оценки прогноза.
- История запросов и сохранение результатов.
- Режимы мок‑данных для офлайн/CI.

## Технологии

- **Web**: Next.js 15, React 19, Redux Toolkit, Tailwind CSS.
- **API**: Node.js, TypeScript, PostgreSQL.
- **Инфраструктура**: Docker, Docker Compose, pnpm workspaces.

## Структура репозитория

- `apps/web` — фронтенд (Next.js).
- `apps/api` — API‑сервис и БД‑миграции.
- `packages/shared` — общие типы/утилиты.
- `docker-compose*.yml` — окружения для разработки и прод‑сборки.

## Старт (локально)

### 1) Настройка окружения

```bash
cp .env.example .env
```

При необходимости отредактируйте `.env`. Для локальной разработки можно поставить `JWT_SECRET=0` (или любое непустое значение).

## Запуск через Docker Compose

### Development

```bash
docker compose -f docker-compose-dev.yml up --build
```

### Production‑режим

```bash
docker compose up --build
```

После старта сервисы будут доступны по адресам:

- Web: http://localhost:3000
- API: http://localhost:3001

## Основные переменные окружения

Файл‑шаблон: `.env.example`.

- **Postgres**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- **API**: `API_PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Web**: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_USE_MOCK_MARKET`
