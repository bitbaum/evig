/**
 * Observed health of the Hirn chat provider layer.
 *
 * `/api/health` already checks the database and Meilisearch, and neither of
 * those tells you anything about whether Hirn can actually answer — a dead
 * Groq/OpenRouter key or an exhausted provider cascade looks identical to
 * "healthy" from that endpoint's point of view. This fleet has already lost
 * an AI feature to exactly that blind spot once (botsmann, 2026-08-28): a
 * friendly 5xx from the chat route and a database-only health check that
 * kept reporting "healthy" the whole time.
 *
 * `getChatResponse` (in `./providers`) records the outcome of every real
 * chat attempt here; `/api/health` reports it as a named service alongside
 * database and Meilisearch. Deliberately in-process — evig runs as a single
 * service, so module state is shared by every request. If it is ever scaled
 * horizontally this becomes per-instance and wants a shared store.
 */

import { createHealthTracker } from 'ai-kit';

const tracker = createHealthTracker({ downAfter: 3 });

/** Call after a chat completion that produced usable content. */
export function recordLLMSuccess(): void {
  tracker.recordSuccess();
}

/** Call when provider selection or generation threw. */
export function recordLLMFailure(error: unknown): void {
  tracker.recordFailure(error);
}

export function getLLMHealth() {
  const health = tracker.getHealth();
  return {
    status: health.status,
    consecutiveFailures: health.consecutiveFailures,
    lastError: health.lastError,
    lastSuccessAt: health.lastSuccessAt ? new Date(health.lastSuccessAt).toISOString() : null,
    lastFailureAt: health.lastFailureAt ? new Date(health.lastFailureAt).toISOString() : null,
  };
}

/** Test seam. */
export function resetLLMHealth(): void {
  tracker.reset();
}
