# мониторинг

## цель
- sentry собирает ошибки фронтенда и бэкенда через конфигурацию из env
- dsn и env значения лежат в .env файлах а не в коде

## env
- NEXT_PUBLIC_SENTRY_DSN dsn проекта sentry для браузера
- NEXT_PUBLIC_SENTRY_ENABLED включает отправку с клиента при true
- NEXT_PUBLIC_SENTRY_ENVIRONMENT тег environment для событий браузера
- NEXT_PUBLIC_SENTRY_RELEASE тег release для событий браузера
- SENTRY_DSN dsn проекта sentry для api
- SENTRY_ENABLED включает отправку на api при true
- SENTRY_ENVIRONMENT тег environment для событий api
- SENTRY_RELEASE тег release для событий api

## frontend flow
- init выполняется в apps/web/src/shared/monitoring/sentry.ts после монтирования MonitoringBoundary
- init требует NEXT_PUBLIC_SENTRY_ENABLED=true и NODE_ENV=production
- boundary в apps/web/src/shared/monitoring/MonitoringBoundary.tsx оборачивает приложение в layout.tsx
- необработанные ошибки и отклоненные промисы отправляются как sentry envelopes
- helper экспортирует captureWorkerFailure и captureDataFailure для кастомных сигналов при необходимости

## backend flow
- initMonitoring находится в apps/api/src/monitoring/sentry.js и запускается при старте сервера
- модуль привязывает uncaughtException и unhandledRejection когда SENTRY_ENABLED=true и NODE_ENV=production
- обработчик запросов оборачивает ответы и отправляет captureServerException для ошибок сервера

## как настроить проект sentry
- создайте проект в интерфейсе sentry и скопируйте javascript dsn
- положите browser dsn в NEXT_PUBLIC_SENTRY_DSN а api dsn в SENTRY_DSN внутри .env.local или секретов деплоя
- задайте environments и releases чтобы соответствовали именам ваших деплоев

## как проверить
- для фронтенда запустите `NEXT_PUBLIC_SENTRY_ENABLED=true NEXT_PUBLIC_SENTRY_DSN=<dsn> NEXT_PUBLIC_SENTRY_ENVIRONMENT=local NEXT_PUBLIC_SENTRY_RELEASE=local NODE_ENV=production pnpm --filter @assetpredict/web dev` затем откройте приложение и вызовите `throw new Error('frontend sentry smoke')` в консоли devtools
- для бэкенда запустите `SENTRY_ENABLED=true SENTRY_DSN=<dsn> SENTRY_ENVIRONMENT=local SENTRY_RELEASE=local NODE_ENV=production pnpm --filter @assetpredict/api start` затем вызовите `curl http://localhost:3001/monitoring/debug-error` чтобы принудительно отправить ошибку
