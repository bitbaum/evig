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

import { db } from '@/db';
import { and, eq, isNull } from 'drizzle-orm';
import { inventoryItems } from '@/db/schema/inventory';
import { syncToKivvi, mapConditionToKivvi, isKivviConfigured } from '@/lib/kivvi/client';
import { logger } from '@/lib/logger';

export interface KivviProductSyncInput {
  /** inventory_items.id — receives the Kivvi id + sync status. */
  inventoryId: string;
  hersteller?: string | null;
  produktname: string;
  kurzbeschreibung?: string | null;
  verkaufspreis?: number | null;
  zustand?: string | null;
  location?: string | null;
  /** Raw specs (JSON string or object) — parsed leniently like erfassung does. */
  langtext?: string | Record<string, unknown> | null;
}

/**
 * Parse specs leniently — a malformed string just means "no specs".
 * Kivvi wants string values, so non-string spec values are stringified.
 */
function parseSpecs(
  langtext: KivviProductSyncInput['langtext'],
): Record<string, string> | undefined {
  if (!langtext) return undefined;
  let raw: unknown;
  try {
    raw = typeof langtext === 'string' ? JSON.parse(langtext) : langtext;
  } catch {
    return undefined;
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
      k,
      typeof v === 'string' ? v : JSON.stringify(v),
    ]),
  );
}

/**
 * One stable identity for the CREATE event, not a hash of changing product
 * details. A crash after Kivvi creates the item but before evig stores its ID
 * can safely replay within Kivvi's idempotency retention window.
 */
export function kivviInventoryCreateKey(inventoryId: string): string {
  return `evig:inventory:create:v1:${inventoryId}`;
}

/**
 * Push a newly captured device to Kivvi without blocking the intake response.
 * A database lookup first prevents late/delayed invocations from re-creating
 * an item that already has a canonical ERP reference.
 *
 * This remains best-effort, NOT a durable outbox. A missing local link after
 * Kivvi's key retention expires requires reconciliation before replay.
 */
export function syncProductToKivvi(input: KivviProductSyncInput): void {
  if (!isKivviConfigured()) return;

  void (async () => {
    const [existing] = await db
      .select({ kivviInventoryItemId: inventoryItems.kivviInventoryItemId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, input.inventoryId))
      .limit(1);
    if (!existing) {
      logger.warn('Kivvi sync skipped: inventory row not found', { inventoryId: input.inventoryId });
      return;
    }
    if (existing.kivviInventoryItemId) return;

    const result = await syncToKivvi(
      {
        description: `${input.hersteller ? `${input.hersteller} ` : ''}${input.produktname}`,
        condition: mapConditionToKivvi(input.zustand),
        askingPrice: input.verkaufspreis != null ? String(input.verkaufspreis) : undefined,
        location: input.location ?? undefined,
        notes: input.kurzbeschreibung ?? undefined,
        specs: parseSpecs(input.langtext),
      },
      kivviInventoryCreateKey(input.inventoryId),
    );

    if (result.success) {
      await db
        .update(inventoryItems)
        .set({
          kivviInventoryItemId: result.kivviInventoryItemId,
          kivviSyncStatus: 'synced',
          kivviSyncedAt: new Date().toISOString(),
        })
        .where(and(eq(inventoryItems.id, input.inventoryId), isNull(inventoryItems.kivviInventoryItemId)));
      return;
    }

    if (result.error !== 'Kivvi not configured') {
      logger.warn('Kivvi sync failed', {
        inventoryId: input.inventoryId,
        error: result.error,
      });
      await db
        .update(inventoryItems)
        .set({ kivviSyncStatus: 'error' })
        .where(and(eq(inventoryItems.id, input.inventoryId), isNull(inventoryItems.kivviInventoryItemId)));
    }
  })().catch((err: unknown) =>
    logger.error('Kivvi intake sync failed', { inventoryId: input.inventoryId, err }),
  );
}
