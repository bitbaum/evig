/**
 * Erfassung API - Product intake and registration
 *
 * POST /api/admin/erfassung
 * Creates a new product in the inventory system
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { transaction } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import type { ErfassungPayload } from '@/types/erfassung'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    const payload: ErfassungPayload = await request.json()

    // Validate required fields
    if (!payload.hersteller || !payload.produktname) {
      return apiBadRequest('Hersteller und Produktname sind erforderlich')
    }

    if (payload.verkaufspreis === undefined || payload.verkaufspreis < 0) {
      return apiBadRequest('Gültiger Verkaufspreis ist erforderlich')
    }

    const action = payload.action || (payload.publish ? 'publish' : 'draft')

    // Use transaction for data integrity
    const result = await transaction(async (client) => {
      return createErfassungProduct(payload, session.user.id, client)
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
}
