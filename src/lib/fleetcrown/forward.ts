/**
 * FleetCrown feedback forwarder.
 *
 * After a site suggestion is persisted locally (the SSOT stays
 * site_suggestions + the admin Rückmeldungen inbox), it is additionally
 * forwarded to the founder's FleetCrown per-project feedback inbox, where
 * website feedback from all projects is triaged in one place.
 *
 * Configuration (add to .env):
 *   FLEETCROWN_FEEDBACK_INGEST_URL=https://<fleetcrown-host>/api/feedback/ingest
 *   FLEETCROWN_FEEDBACK_KEY=fk_...   (issued in the FleetCrown project's Feedback tab)
 *
 * Mirrors the Kivvi sync contract: never throws, silently skips when not
 * configured (expected in dev), and passes the suggestion row id as
 * externalId so FleetCrown de-duplicates retries. Server-side only.
 */

import { logger } from '@/lib/logger'

function getConfig(): { url: string; key: string } | null {
  const url = process.env.FLEETCROWN_FEEDBACK_INGEST_URL
  const key = process.env.FLEETCROWN_FEEDBACK_KEY
  if (!url || !key) return null
  return { url, key }
}

export function isFleetCrownFeedbackConfigured(): boolean {
  return getConfig() !== null
}

export interface ForwardSuggestionInput {
  /** site_suggestions row id — FleetCrown's dedup handle for retries */
  id: string
  suggestion: string
  contact?: string | null
  scope?: string | null
  url?: string | null
  page?: string | null
  pageTitle?: string | null
  pageSection?: string | null
  selectedElements?: unknown[] | null
}

export type ForwardResult = { success: true } | { success: false; error: string }

const FORWARD_SCOPES = new Set(['page', 'element', 'site'])

/**
 * Forward a persisted suggestion to FleetCrown. Never throws — the local
 * pipeline (DB + notifications + email) must not depend on FleetCrown being
 * reachable. Call fire-and-forget after the local persist succeeds.
 */
export async function forwardSuggestionToFleetCrown(
  input: ForwardSuggestionInput,
): Promise<ForwardResult> {
  const config = getConfig()
  if (!config) {
    return { success: false, error: 'FleetCrown feedback forwarding not configured' }
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: config.key,
        message: input.suggestion,
        contact: input.contact || undefined,
        scope: input.scope && FORWARD_SCOPES.has(input.scope) ? input.scope : undefined,
        pageUrl: input.url || undefined,
        pageTitle: input.pageTitle || input.page || undefined,
        selectedElements: input.selectedElements ?? undefined,
        source: 'forward',
        externalId: input.id,
        metadata: {
          origin: 'revampit',
          page: input.page ?? null,
          pageSection: input.pageSection ?? null,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: body.error || `FleetCrown ingest HTTP ${response.status}` }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'FleetCrown forward failed',
    }
  }
}

/**
 * Fire-and-forget wrapper for the suggestion route: skips silently when not
 * configured, logs (never throws) when a configured forward fails.
 */
export function forwardSuggestionInBackground(input: ForwardSuggestionInput): void {
  if (!isFleetCrownFeedbackConfigured()) return
  void forwardSuggestionToFleetCrown(input).then(result => {
    if (!result.success) {
      logger.warn('FleetCrown feedback forward failed', { suggestionId: input.id, error: result.error })
    }
  })
}
