/**
 * POST /api/webhooks/kivvi — Inbound receiver for Kivvi ERP item changes.
 *
 * This is the REVERSE leg of the bidirectional product sync. Kivvi is the
 * canonical ERP: when an inventory item changes there (price re-graded, status
 * moved to sold/returned/recycled/donated, description edited), Kivvi POSTs an
 * HMAC-signed webhook here so the RevampIT website mirrors the change.
 *
 * Contract (verified against Kivvi):
 *   Headers: X-Kivvi-Event, X-Kivvi-Signature (hex HMAC-SHA256 of the RAW body
 *            using KIVVI_WEBHOOK_SECRET), Content-Type: application/json
 *   Body:    { event, timestamp, companyId, data: { id, itemNumber, description,
 *             condition, status, warehouseId, askingPrice } }
 *            (status_changed carries { id, itemNumber, status })
 *   data.id  = Kivvi inventory item id = RevampIT inventory_items.kivviInventoryItemId
 *
 * LOOP SUPPRESSION (critical): every write below is a direct db.update on the
 * local tables. This handler NEVER calls syncToKivvi / updateKivviInventoryItem,
 * so a receiver write can never bounce a push back to Kivvi and start an echo
 * loop. The forward push lives only in the admin edit path.
 *
 * Idempotent / out-of-order safe: writes are an upsert of Kivvi's current
 * values, so replays and reordered deliveries converge to the same state.
 */

import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { inventoryItems } from '@/db/schema/inventory';
import { listings } from '@/db/schema/marketplace';
import { mapConditionFromKivvi } from '@/lib/kivvi/client';
import { LISTING_STATUS } from '@/config/marketplace';
import { apiSuccess, apiBadRequest, apiUnauthorized, apiError } from '@/lib/api/helpers';
import { logger } from '@/lib/logger';

const KIVVI_WEBHOOK_SECRET = process.env.KIVVI_WEBHOOK_SECRET;

/**
 * Verify X-Kivvi-Signature = hex HMAC-SHA256(rawBody, KIVVI_WEBHOOK_SECRET)
 * using a constant-time comparison. Fails closed when the secret is unset.
 */
function verifyKivviSignature(rawBody: string, signature: string | null): boolean {
  if (!KIVVI_WEBHOOK_SECRET) {
    logger.error('KIVVI_WEBHOOK_SECRET not set — rejecting Kivvi webhook (fail closed)');
    return false;
  }
  if (!signature) return false;

  const expected = createHmac('sha256', KIVVI_WEBHOOK_SECRET).update(rawBody).digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

// Kivvi item statuses that remove an item from active RevampIT selling. Each
// maps to the nearest valid local inventory_items.status (DB CHECK allows only
// available/reserved/sold/damaged/missing) and always delists the public
// listing (status='sold'), since the item is no longer sellable stock in Kivvi.
const TERMINAL_STATUS_FROM_KIVVI: Readonly<Record<string, string>> = {
  sold: 'sold',
  returned: 'available',
  recycled: 'missing',
  donated: 'missing',
};

interface KivviWebhookData {
  id?: string;
  itemNumber?: string;
  description?: string;
  condition?: string;
  status?: string;
  warehouseId?: string | null;
  askingPrice?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Read the RAW body — the HMAC is computed over these exact bytes.
    const rawBody = await request.text();
    const signature = request.headers.get('x-kivvi-signature');

    if (!verifyKivviSignature(rawBody, signature)) {
      logger.warn('Kivvi webhook: invalid signature', { signaturePresent: signature !== null });
      return apiUnauthorized('Invalid signature');
    }

    const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    if (!body || typeof body !== 'object') {
      return apiBadRequest('Invalid body');
    }

    const event: string | undefined = body.event;
    const data: KivviWebhookData = body.data ?? {};
    const kivviItemId = data.id;

    if (!kivviItemId) {
      logger.warn('Kivvi webhook: missing data.id', { event });
      return apiBadRequest('Missing data.id');
    }

    // Locate the local mirror by Kivvi's item id. Unknown item → 200 ignored
    // (not an error): the item may belong to stock never surfaced on the site.
    const [item] = await db
      .select({ id: inventoryItems.id, status: inventoryItems.status })
      .from(inventoryItems)
      .where(eq(inventoryItems.kivviInventoryItemId, kivviItemId))
      .limit(1);

    if (!item) {
      logger.info('Kivvi webhook: no local inventory item for Kivvi id, ignoring', { event, kivviItemId });
      return apiSuccess({ ignored: true });
    }

    const kivviStatus = data.status?.toLowerCase().trim();
    const terminalStatus = kivviStatus ? TERMINAL_STATUS_FROM_KIVVI[kivviStatus] : undefined;

    // Terminal status change → mirror status locally + delist the listing.
    // Handles both status_changed and updated events carrying a terminal status.
    if (terminalStatus) {
      // LOOP SUPPRESSION: direct db writes only — no Kivvi push from here.
      await db
        .update(inventoryItems)
        .set({ status: terminalStatus, kivviSyncedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(inventoryItems.id, item.id));

      await db
        .update(listings)
        .set({ status: LISTING_STATUS.SOLD })
        .where(eq(listings.inventoryItemId, item.id));

      logger.info('Kivvi webhook: applied terminal status', { event, kivviItemId, localItemId: item.id, kivviStatus, localStatus: terminalStatus });
      return apiSuccess({ updated: true });
    }

    // status_changed with a non-terminal status carries no other fields to
    // mirror — acknowledge and stop.
    if (event === 'inventory_item.status_changed') {
      return apiSuccess({ updated: false });
    }

    // updated / created → mirror the current field values (upsert).
    // LOOP SUPPRESSION: direct db.update only — no Kivvi push from here.
    const update: Record<string, unknown> = {
      kivviSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (data.askingPrice != null) update.sellingPriceChf = String(data.askingPrice);
    if (data.condition != null) update.conditionOverride = mapConditionFromKivvi(data.condition);
    // inventory_items has no dedicated description column; conditionNotes is the
    // free-text field on the row, so Kivvi's description mirrors there.
    if (data.description != null) update.conditionNotes = data.description;

    await db.update(inventoryItems).set(update).where(eq(inventoryItems.id, item.id));

    logger.info('Kivvi webhook: mirrored item fields', { event, kivviItemId, localItemId: item.id });
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiError(error, 'Internal error');
  }
}
