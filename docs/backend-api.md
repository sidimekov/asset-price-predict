# Backend API: эндпоинты и правила использования

Описание текущих HTTP-эндпоинтов бэкенда, их назначение, форматы запросов/ответов, а также типичные сценарии использования.

## Общие сведения

- **Base URL**: зависит от окружения (например, `http://localhost:<PORT>`).
- **Content-Type**: `application/json` для запросов с телом.
- **Аутентификация**: используется Bearer-токен в заголовке `Authorization`.

Пример заголовка:

```http
Authorization: Bearer <token>
```

Токен выдаётся при логине/регистрации и проверяется на защищённых эндпоинтах.

## Формат ошибок

### Ошибки валидации (400)

Если входные данные не проходят Zod-валидацию, API возвращает:

```json
{
  "error": "Validation failed",
  "details": ["field: message", "..."]
}
```

### Ошибки авторизации (401)

Если токен отсутствует/некорректный:

```json
{
  "error": "Unauthorized"
}
```

### Прочие типовые ошибки

- `404` — ресурс не найден (`Account not found`, `Forecast not found`).
- `409` — конфликт (например, `Email already in use`).
- `500` — внутренняя ошибка сервера.

## Эндпоинты

### 1. Healthcheck

**GET `/health`**

Назначение: проверка доступности сервиса и статуса подключения к БД.

**Ответ (200):**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": true
}
```

- `db` — результат последней проверки соединения с базой.

---

### 2. Регистрация

**POST `/auth/register`**

Назначение: регистрация пользователя и выдача токена доступа.

**Тело запроса:**

```json
{
  "email": "user@example.com",
  "password": "strong-password",
  "username": "optional-name"
}
```

Ограничения:

- `email` — валидный email.
- `password` — 6–256 символов.
- `username` — 3–64 символа (опционально; если не указан, имя генерируется).

**Ответ (200):**

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "user",
    "avatarUrl": "https://..."
  }
}
```

**Возможные ошибки:**

- `409` — `Email already in use`.
- `400` — ошибка валидации.

---

### 3. Логин

**POST `/auth/login`**

Назначение: авторизация по email и паролю, выдача токена доступа.

**Тело запроса:**

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

**Ответ (200):**

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "user",
    "avatarUrl": "https://..."
  }
}
```

**Возможные ошибки:**

- `401` — `Invalid credentials`.
- `400` — ошибка валидации.

---

### 4. Выход

**POST `/auth/logout`**

Назначение: заглушка на выход (сервер не хранит сессии). Просто возвращает `ok`.

**Ответ (200):**

```json
{ "ok": true }
```

---

### 5. Получение профиля

**GET `/account`**

Назначение: получить профиль текущего пользователя.

**Требуется авторизация** (Bearer-токен).

**Ответ (200):**

```json
{
  "id": "user-id",
  "username": "user",
  "email": "user@example.com",
  "avatarUrl": "https://..."
}
```

**Возможные ошибки:**

- `401` — `Unauthorized`.
- `404` — `Account not found`.

---

### 6. Обновление профиля

**PATCH `/account`**

Назначение: обновить профиль пользователя (email/username/avatar/password).

**Требуется авторизация** (Bearer-токен).

**Тело запроса:**

```json
{
  "email": "new@example.com",
  "username": "new-name",
  "avatarUrl": "https://...",
  "password": "new-password",
  "currentPassword": "old-password"
}
```

Правила:

- Нужно передать **хотя бы одно поле**.
- При смене пароля обязательно поле `currentPassword`.

**Ответ (200):**

```json
{
  "id": "user-id",
  "username": "new-name",
  "email": "new@example.com",
  "avatarUrl": "https://..."
}
```

**Возможные ошибки:**

- `400` — ошибка валидации (например, нет ни одного поля).
- `401` — `Unauthorized` или `Invalid credentials` (при неверном `currentPassword`).
- `404` — `Account not found`.
- `409` — `Email already in use`.

---

### 7. Создание прогноза

**POST `/forecast`**

Назначение: создать запись прогноза для пользователя.

**Требуется авторизация** (Bearer-токен).

**Тело запроса:**

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1d",
  "horizon": 30,
  "inputUntil": "2025-01-31T12:00:00Z",
  "model": "baseline"
}
```

Ограничения:

- `horizon` — положительное целое число, максимум **500**.
- `inputUntil` — ISO-строка даты (опционально).
- `model` — строковый идентификатор модели (опционально).

**Ответ (200):**

```json
{
  "id": "forecast-id",
  "symbol": "BTCUSDT",
  "timeframe": "1d",
  "createdAt": "2025-01-31T12:00:00Z",
  "horizon": 30,
  "series": {
    "p10": [],
    "p50": [],
    "p90": [],
    "t": []
  }
}
```

Примечание: на текущем этапе бэкенд сохраняет пустые массивы в `series`.

---

### 8. Список прогнозов

**GET `/forecasts`**

Назначение: получить историю прогнозов пользователя.

**Требуется авторизация** (Bearer-токен).

**Query-параметры:**

- `page` — номер страницы (по умолчанию `1`).
- `limit` — размер страницы (по умолчанию `20`).

**Ответ (200):**

```json
{
  "items": [
    {
      "id": "forecast-id",
      "symbol": "BTCUSDT",
      "timeframe": "1d",
      "createdAt": "2025-01-31T12:00:00Z",
      "horizon": 30
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 9. Детальный прогноз

**GET `/forecasts/:id`**

Назначение: получить детальный прогноз пользователя по `id`.

**Требуется авторизация** (Bearer-токен).

**Ответ (200):**

```json
{
  "id": "forecast-id",
  "symbol": "BTCUSDT",
  "timeframe": "1d",
  "createdAt": "2025-01-31T12:00:00Z",
  "horizon": 30,
  "series": {
    "p10": [],
    "p50": [],
    "p90": [],
    "t": []
  },
  "factors": [{ "name": "trend", "impact": 0.42, "shap": 0.11, "conf": 0.9 }],
  "metrics": { "mae": 0.12, "mape": 0.04, "coverage": 0.8 }
}
```

`factors` и `metrics` опциональны: могут отсутствовать, если ещё не рассчитаны.

**Возможные ошибки:**

- `401` — `Unauthorized`.
- `404` — `Forecast not found`.
- `500` — если ответ не соответствует контракту.

## Примеры использования (curl)

### Регистрация

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Логин + запрос профиля

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}' | jq -r .token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/account
```

### Создание прогноза

```bash
curl -X POST http://localhost:3000/forecast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"symbol":"BTCUSDT","timeframe":"1d","horizon":30}'
```
