// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7f4807e55bc61dd2f183a4eb670e8b84@o4508971881529344.ingest.de.sentry.io/4508971898110032",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Set environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  // Trace sampling
  tracesSampleRate: 1,

  // Debug only in development
  debug: process.env.NODE_ENV === "development",
});
