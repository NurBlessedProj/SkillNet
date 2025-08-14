// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7f4807e55bc61dd2f183a4eb670e8b84@o4508971881529344.ingest.de.sentry.io/4508971898110032",

  // Set environment based on Vercel
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  integrations: [Sentry.replayIntegration()],

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Session Replay settings
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },

  // Debug only in development
  debug: process.env.NODE_ENV === "development",
});
