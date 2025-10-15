# Contributing

## 1) Архитектура (кратко)
- Проект — монорепозиторий:
    - `apps/web` — клиент (React + Next.js, TS).
    - `apps/api` — сервер (Node.js, TS).
    - `packages/shared` — общие типы/утилиты
- Тесты:
    - **unit** — Vitest.
    - **e2e** — Playwright.
- Качество:
    - ESLint, Prettier
    - Цель покрытия unit-тестами: не менее 80%.

## 2) GitHub Flow и ветвление
- В ветку `main` нельзя коммитить напрямую - установлено правило в Github
- Шаги:
    1. Создать ветку от `main`:  
       `feature/short-name`, `fix/bug-id`.
    2. Коммит изменений (желательно маленькими порциями).
    3. Открыть **Pull Request** в `main`.
    4. Получить **review** и дождаться CI.
    5. **squash & merge** (или merge commit).

### Именование коммитов (рекомендация)
- Стиль **Conventional Commits** приветствуется, но не обязателен.
  Примеры:  
  `feat(web): add forecast chart p50/p10-p90`  
  `fix(api): handle /forecast`  
  `test(shared): add utils coverage`

## 3) Как запустить проект локально
```bash
pnpm install
pnpm build
pnpm dev
````

## 4) Линтеры и форматирование

- Запуск: `pnpm lint` и `pnpm format:check` (если уже настроены)
- Старайтесь фиксить предупреждения. Автоформатирование — `pnpm format`.

## 5) Тесты

- **Unit:** `pnpm test` — должны проходить локально
- **E2E:** — для изменений, затрагивающих пользовательские сценарии
  - `pnpm install` 
  - `pnpm exec playwright install --with-deps`
  - `pnpm -r --filter @assetpredict/web dev`
  - `pnpm -r --filter @assetpredict/web e2e` (после поднятия сервера)
- Если добавляешь фичу — добавь или обнови тесты
- Покрытие unit не менее **80%** по изменённым модулям — целевой порог CI

## 6) Pull Request

- Используй шаблон PR (`.github/PULL_REQUEST_TEMPLATE.md`).
- К PR приложи:

    * Ссылку на issue.
    * Описание **что/зачем** сделано.
    * Инструкцию, **как проверить**.

### Обязательные проверки CI (merge-gate)

- Unit-тесты прошли
- Покрытие unit не менее **80%**
- E2E-тесты прошли (если включены для PR)
- Линтеры (eslint/prettier) прошли

## 7) Ревью и принятие

- Если изменения важные и считаете, что код нуждается в review, то указывайте ревьюера
- Ревьюер проверяет: корректность, тесты, покрытие, архитектуру, стиль
- request changes — ответ на комментарии/исправления
- После пройденного CI и аппрува — merge по политике репозитория