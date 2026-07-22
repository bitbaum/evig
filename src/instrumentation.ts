/**
 * Next.js instrumentation entry — runs once per server process at startup.
 *
 * Used here to wire Sentry conditionally. The DSN is the *only* gate:
 *   - SENTRY_DSN unset / empty → Sentry SDK is never loaded, zero overhead
 *   - SENTRY_DSN set           → Sentry initializes for the runtime
 *     (Node server, edge, or browser — Next.js calls register() once per)
 *
 * To enable in production:
 *   1. Create a project at https://sentry.io
 *   2. Add `SENTRY_DSN=https://...@sentry.io/...` to the box's `.env` (/opt/revampit/app/.env)
 *   3. (Optional, for sourcemap upload + tunneling) install the build-time
 *      wrapper later: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 *
 * Until DSN is set, this file is inert. Safe to commit.
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
