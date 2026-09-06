/**
 * Can Hirn reach a model RIGHT NOW?
 *
 * `/api/health` reports what the last real chat attempt did. Straight after a
 * deploy nothing has been attempted, and that state used to be reported as
 * `healthy` — a green word backed by no evidence at all, where a dead key, a
 * retired model and a perfect chain all looked identical. It now reports
 * `unknown`, which is honest but still not an answer.
 *
 * This is the answer. It makes a real call, on demand, and it is the only
 * thing that can tell "nothing has failed" apart from "it works".
 *
 * Gating and caching are ai-kit's (see `createAiHealthHandler`): a probe runs
 * only on `?probe=1` with the secret, a success is cached ten minutes so a
 * monitor in a retry loop cannot drain the daily budget Hirn's real chats
 * share, and a failure is never cached.
 *
 * The chain is resolved per probe rather than at construction, because it
 * lives in the database: an admin who changes the provider in /admin/hirn and
 * then probes must be told about the configuration they just saved.
 */

import { createAiHealthHandler } from '@bitbaum/ai-kit';
import { currentChatChain } from './providers';
import { llmTracker } from './health';

/**
 * Built lazily. Next evaluates module-level code during the BUILD, where
 * neither the database nor the runtime's env is reachable.
 */
let handler: ((request: Request) => Promise<Response>) | null = null;

export function hirnLivenessHandler(request: Request): Promise<Response> {
  handler ??= createAiHealthHandler({
    // Chain AND keys together: a key configured in /admin/hirn beats the
    // environment for a real chat, so a probe that read only `process.env`
    // would report "no key" for a provider that is configured and working.
    resolveChain: () => currentChatChain(),
    secret: process.env.AI_PROBE_SECRET,
    // The same tracker a real chat writes into, so one probe also answers the
    // next ordinary /api/health poll instead of dying with this request.
    health: llmTracker,
  });
  return handler(request);
}
