/**
 * Observed health of `callWithFallback`/`callVisionWithFallback` — the
 * cascade behind form-assist, protocol/task/vote advisors, smart product
 * entry, and blog translation.
 *
 * A SEPARATE tracker from `../hirn/health.ts` on purpose: this module and
 * `../hirn/providers` are two independent AI stacks with their own config
 * loading and their own cascades, even though both ultimately read
 * `hirnProviderSettings`. A bug isolated to one (a stale cache, a broken
 * fallback order) should show up as one named service going down in
 * `/api/health`, not get averaged away inside a single "AI" bucket.
 *
 * Deliberately in-process — see `../hirn/health.ts` for why.
 */

import { createHealthTracker } from 'ai-kit'

const tracker = createHealthTracker({ downAfter: 3 })

/** Call after `callWithFallback`/`callVisionWithFallback` returns a result. */
export function recordAIToolsSuccess(): void {
  tracker.recordSuccess()
}

/** Call when every provider in the cascade failed (a `null` return). */
export function recordAIToolsFailure(error: unknown): void {
  tracker.recordFailure(error)
}

export function getAIToolsHealth() {
  const health = tracker.getHealth()
  return {
    status: health.status,
    consecutiveFailures: health.consecutiveFailures,
    lastError: health.lastError,
    lastSuccessAt: health.lastSuccessAt ? new Date(health.lastSuccessAt).toISOString() : null,
    lastFailureAt: health.lastFailureAt ? new Date(health.lastFailureAt).toISOString() : null,
  }
}

/** Test seam. */
export function resetAIToolsHealth(): void {
  tracker.reset()
}
