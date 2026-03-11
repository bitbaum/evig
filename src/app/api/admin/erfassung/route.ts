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
      action,
      published: action === 'publish',
      image_url: result.imageUrl || null,
      message: messages[action] || messages.draft,
    })

  } catch (error) {
    logger.error('Erfassung failed', { error })
    return apiError(error, 'Fehler beim Erfassen des Produkts')
  }
})
