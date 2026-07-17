/**
 * Kivvi product sync (server-only) — SSOT for pushing a freshly captured
 * device to the Kivvi ERP.
 *
 * Fire-and-forget by design: called AFTER the capture transaction commits and
 * never fails the request. Used by the canonical intake route and retained by
 * the legacy erfassung endpoint while old API clients migrate, so the ERP
 * mirrors every device regardless of caller.
 * Skips silently when Kivvi isn't configured (expected in dev).
 */

import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { inventoryItems } from '@/db/schema/inventory'
import { syncToKivvi, mapConditionToKivvi } from '@/lib/kivvi/client'
import { logger } from '@/lib/logger'

export interface KivviProductSyncInput {
  /** inventory_items.id — receives the Kivvi id + sync status. */
  inventoryId: string
  hersteller?: string | null
  produktname: string
  kurzbeschreibung?: string | null
  verkaufspreis?: number | null
  zustand?: string | null
  location?: string | null
  /** Raw specs (JSON string or object) — parsed leniently like erfassung does. */
  langtext?: string | Record<string, unknown> | null
}

/**
 * Parse specs leniently — a malformed string just means "no specs".
 * Kivvi wants string values, so non-string spec values are stringified.
 */
function parseSpecs(langtext: KivviProductSyncInput['langtext']): Record<string, string> | undefined {
  if (!langtext) return undefined
  let raw: unknown
  try {
    raw = typeof langtext === 'string' ? JSON.parse(langtext) : langtext
  } catch {
    return undefined
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  )
}

/**
 * Push the device to Kivvi and record the outcome on the inventory item.
 * Returns immediately (void) — the sync runs detached.
 */
export function syncProductToKivvi(input: KivviProductSyncInput): void {
  syncToKivvi({
    description: `${input.hersteller ? `${input.hersteller} ` : ''}${input.produktname}`,
    // Map RevampIT's zustand vocabulary to Kivvi's enum — a raw 'new'/'defect'
    // would otherwise be rejected by Kivvi with HTTP 400 and never sync.
    condition: mapConditionToKivvi(input.zustand),
    askingPrice: input.verkaufspreis != null ? String(input.verkaufspreis) : undefined,
    location: input.location ?? undefined,
    notes: input.kurzbeschreibung ?? undefined,
    specs: parseSpecs(input.langtext),
  }).then((kivviResult) => {
    if (kivviResult.success) {
      // Store Kivvi ID on the RevampIT inventory record for future reference
      db.update(inventoryItems)
        .set({
          kivviInventoryItemId: kivviResult.kivviInventoryItemId,
          kivviSyncStatus: 'synced',
          kivviSyncedAt: new Date().toISOString(),
        })
        .where(eq(inventoryItems.id, input.inventoryId))
        .catch((err: unknown) => logger.error('Failed to store Kivvi ID', { err }))
    } else if (kivviResult.error !== 'Kivvi not configured') {
      // Log real errors, not just "not configured" (expected in dev)
      logger.warn('Kivvi sync failed', { inventoryId: input.inventoryId, error: kivviResult.error })
      db.update(inventoryItems)
        .set({ kivviSyncStatus: 'error' })
        .where(eq(inventoryItems.id, input.inventoryId))
        .catch(() => {})
    }
  }).catch(() => {})
}
