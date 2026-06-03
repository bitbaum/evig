/**
 * Sentry — Node.js server runtime configuration.
 *
 * Loaded by src/instrumentation.ts ONLY when SENTRY_DSN is set, so this
 * file is fully inert in dev / when monitoring isn't desired. No bundle
 * impact, no startup cost.
 *
 * Tuning rationale:
 *   - tracesSampleRate 0.1: sample 10% of server-rendered requests for
 *     performance traces. Bump to 1.0 in incident response, drop to 0
 *     to disable performance entirely.
 *   - ignoreErrors: filter expected operational signals that aren't
 *     bugs (e.g. cancelled fetches when a user navigates away).
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    // Client-aborted fetches surface as AbortError on the server side too.
    'AbortError',
    'The user aborted a request',
  ],
})
