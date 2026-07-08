import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // No-op until NEXT_PUBLIC_SENTRY_DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Keep sampling low to stay comfortably within the free tier
  tracesSampleRate: 0.1,
  // Session Replay disabled to conserve free-tier quota
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// Instrument client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
