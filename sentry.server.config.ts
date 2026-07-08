import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // No-op until SENTRY_DSN is configured
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Keep sampling low to stay comfortably within the free tier
  tracesSampleRate: 0.1,
});
