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
import { logger } from '@/lib/logger'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { syncProductToKivvi } from '@/lib/kivvi/sync-product'
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

    // Push to Kivvi ERP after transaction commits (non-blocking — never fails
    // the request). Shared helper: the intake path syncs the same way.
    syncProductToKivvi({
      inventoryId: result.inventoryId,
      hersteller: payload.hersteller,
      produktname: payload.produktname,
      kurzbeschreibung: payload.kurzbeschreibung,
      verkaufspreis: payload.verkaufspreis,
      zustand: payload.zustand,
      location: payload.location,
      langtext: payload.langtext,
    })

    // Action-specific messages
    const messages: Record<string, string> = {
      draft: 'Produkt als Entwurf gespeichert',
      erfassen: 'Produkt erfasst',
      publish: 'Produkt erfasst und im Shop veröffentlicht',
    }
    const message = result.qcRequired
      ? 'Produkt erfasst — Qualitätskontrolle im Geräte-Eingang erforderlich'
      : messages[action] || messages.draft

    logger.info('Product erfasst', {
      itemUUID: result.itemUUID,
      productId: result.productId,
      userId: session.user.id,
      action,
      qcRequired: result.qcRequired,
    })

    return apiSuccess({
      item_uuid: result.itemUUID,
      product_id: result.productId,
      inventory_id: result.inventoryId,
      listing_id: result.listingId,
      action,
      published: result.listingId != null,
      qc_required: result.qcRequired,
      image_url: result.imageUrl || null,
      message,
    })

  } catch (error) {
    logger.error('Erfassung failed', { error })
    // Staff-only endpoint: include the underlying cause so the team can act
    // on failures directly instead of guessing from a blanket message.
    const detail = error instanceof Error && error.message ? ` – ${error.message}` : ''
    return apiError(error, `Fehler beim Erfassen des Produkts${detail}`)
  }
})
