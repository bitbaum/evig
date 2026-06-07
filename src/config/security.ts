/**
 * Security / auth time constants — SSOT.
 *
 * Centralises the various session, lockout, and transport-security
 * time windows that were previously inlined as `30 * 24 * 60 * 60`-style
 * literals across the auth + payment modules. One named constant per
 * window means a single edit-point if policy changes.
 *
 * Naming convention: suffix names with the unit (_SECONDS or _MS) so
 * callers don't have to remember which API expects which.
 */

const SECONDS_PER_DAY = 24 * 60 * 60
const SECONDS_PER_HOUR = 60 * 60
const ONE_DAY_MS = SECONDS_PER_DAY * 1000

/**
 * How long a JWT session stays valid before the user must re-authenticate.
 * NextAuth `session.maxAge` accepts seconds.
 *
 * 30 days mirrors the cookie expiration in `auth.config.ts`. Tightening
 * this rolls all signed-in users out — coordinate with the team first.
 */
export const SESSION_MAX_AGE_SECONDS = 30 * SECONDS_PER_DAY

/**
 * How often the session token is refreshed while in active use. NextAuth
 * `session.updateAge` accepts seconds. 24 hours means a daily-active
 * user keeps a perpetually-rolling 30-day session.
 */
export const SESSION_UPDATE_AGE_SECONDS = SECONDS_PER_DAY

/**
 * Hard ceiling on the progressive lockout duration (rate-limiter.ts
 * multiplies the configured per-attempt lockoutDuration by a multiplier;
 * we cap at 24h so a misconfigured policy can't lock a user out for
 * weeks).
 */
export const RATE_LIMIT_LOCKOUT_CAP_MS = ONE_DAY_MS

/**
 * Strict-Transport-Security `max-age` directive (seconds). 1 year per
 * Mozilla's HSTS guidance for production deployments. Browsers cache
 * this — shortening it doesn't take effect until the cached value
 * expires.
 */
export const HSTS_MAX_AGE_SECONDS = 365 * SECONDS_PER_DAY
