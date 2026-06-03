/**
 * Sentry — Edge runtime configuration (middleware, edge routes).
 *
 * Same gate as sentry.server.config.ts — only loaded when SENTRY_DSN
 * is present. Edge runtime has stricter bundle constraints, so we
 * keep this file minimal (no integrations, default tracing).
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
})
