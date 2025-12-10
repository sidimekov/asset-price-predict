import * as Sentry from '@sentry/nextjs';

const enabled =
  process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN;

if (enabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    tracesSampleRate: 0.0,
  });
  console.log('Sentry frontend enabled');
} else {
  console.log('Sentry frontend disabled');
}
