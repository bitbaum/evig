/**
 * Erfassung API - Product intake and registration
 *
 * POST /api/admin/erfassung
 * Creates a new product in the inventory system
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { validateBody, ErfassungCreateSchema } from '@/lib/schemas'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { syncToKivvi, mapConditionToKivvi } from '@/lib/kivvi/client'
import { inventoryItems } from '@/db/schema/inventory'
import type { ErfassungPayload } from '@/types/erfassung'

export const POST = withAdmin('products', async (request, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(ErfassungCreateSchema, raw)
    if (!validation.success) return validation.error
    const payload = validation.data as ErfassungPayload

    const action = payload.action || (payload.publish ? 'publish' : 'draft')

    // Use Drizzle transaction for data integrity
    const result = await db.transaction(async (tx) => {
      return createErfassungProduct(payload, session.user.id, tx)
    })

    // Push to Kivvi ERP after transaction commits (non-blocking — never fails the request)
    syncToKivvi({
      description: `${payload.hersteller ? `${payload.hersteller} ` : ''}${payload.produktname}`,
      // Map RevampIT's zustand vocabulary to Kivvi's enum — a raw 'new'/'defect'
      // would otherwise be rejected by Kivvi with HTTP 400 and never sync.
      condition: mapConditionToKivvi(payload.zustand),
      askingPrice: payload.verkaufspreis != null ? String(payload.verkaufspreis) : undefined,
      location: payload.location ?? undefined,
      notes: payload.kurzbeschreibung ?? undefined,
      specs: payload.langtext
        ? (() => { try { return typeof payload.langtext === 'string' ? JSON.parse(payload.langtext) : payload.langtext } catch { return undefined } })()
        : undefined,
    }).then((kivviResult) => {
      if (kivviResult.success) {
        // Store Kivvi ID on the RevampIT inventory record for future reference
        db.update(inventoryItems)
          .set({
            kivviInventoryItemId: kivviResult.kivviInventoryItemId,
            kivviSyncStatus: 'synced',
            kivviSyncedAt: new Date().toISOString(),
          })
          .where(eq(inventoryItems.id, result.inventoryId))
          .catch((err: unknown) => logger.error('Failed to store Kivvi ID', { err }))
      } else if (kivviResult.error !== 'Kivvi not configured') {
        // Log real errors, not just "not configured" (expected in dev)
        logger.warn('Kivvi sync failed', { inventoryId: result.inventoryId, error: kivviResult.error })
        db.update(inventoryItems)
          .set({ kivviSyncStatus: 'error' })
          .where(eq(inventoryItems.id, result.inventoryId))
          .catch(() => {})
      }
    }).catch(() => {})

    // Action-specific messages
    const messages: Record<string, string> = {
      draft: 'Produkt als Entwurf gespeichert',
      erfassen: 'Produkt erfasst',
      publish: 'Produkt erfasst und im Shop veröffentlicht',
    }

    logger.info('Product erfasst', {
      itemUUID: result.itemUUID,
      productId: result.productId,
      userId: session.user.id,
      action,
    })

    return apiSuccess({
      item_uuid: result.itemUUID,
      product_id: result.productId,
      inventory_id: result.inventoryId,
      listing_id: result.listingId,
      action,
      published: action === 'publish',
      image_url: result.imageUrl || null,
      message: messages[action] || messages.draft,
    })

  } catch (error) {
    logger.error('Erfassung failed', { error })
    // Staff-only endpoint: include the underlying cause so the team can act
    // on failures directly instead of guessing from a blanket message.
    const detail = error instanceof Error && error.message ? ` – ${error.message}` : ''
    return apiError(error, `Fehler beim Erfassen des Produkts${detail}`)
  }
})
