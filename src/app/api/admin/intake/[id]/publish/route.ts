/**
 * Intake Publish API
 *
 * POST /api/admin/intake/[id]/publish — Publish device to marketplace
 * GATED: All required checklist items must be completed first.
 */

import { withAdmin } from '@/lib/api/middleware'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { IntakePublishSchema } from '@/lib/schemas/intake'
import { isChecklistComplete } from '@/config/intake-checklist'
import type { ChecklistState, IntakeTier } from '@/config/intake-checklist'
import { logger } from '@/lib/logger'
import { appendIntakeEvent } from '@/lib/intake/timeline'

interface PublishRow {
  id: string
  ai_product_id: string
  intake_tier: string
  intake_checklist: ChecklistState
  marketplace_status: string
  brand: string
  product_name: string
  short_description: string | null
  category: string | null
}

export const POST = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(IntakePublishSchema, body)
    if (!validation.success) return validation.error
    const { price_chf, title, description } = validation.data

    // Get current state
    const existing = await query<PublishRow>(
      `SELECT ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
              ii.marketplace_status,
              ap.brand, ap.product_name, ap.short_description, ap.category
       FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
       WHERE ii.id = $1 AND ii.intake_tier IS NOT NULL`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = existing.rows[0]

    // Gate: already published?
    if (row.marketplace_status === 'published') {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_ALREADY_PUBLISHED)
    }

    // Gate: checklist complete?
    const tier = row.intake_tier as IntakeTier
    const checklist = (row.intake_checklist || {}) as ChecklistState
    if (!isChecklistComplete(checklist, tier, row.category)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_CHECKLIST_INCOMPLETE)
    }

    // Publish in transaction
    const listingTitle = title || `${row.brand} ${row.product_name}`
    const listingDesc = description || row.short_description || ''

    await transaction(async (client) => {
      // Update inventory item
      await client.query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET marketplace_status = 'published', selling_price_chf = $1, updated_at = NOW()
         WHERE id = $2`,
        [price_chf, id]
      )

      // Create marketplace listing
      await client.query(
        `INSERT INTO ${TABLE_NAMES.MARKETPLACE_LISTINGS} (
          inventory_item_id, title, description, price_chf,
          platform, status, published_at, created_by
        ) VALUES ($1, $2, $3, $4, 'internal', 'published', NOW(), $5)`,
        [id, listingTitle, listingDesc, price_chf, session.user.id]
      )

      // Update product estimated price
      await client.query(
        `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
         SET estimated_price_chf = $1, updated_at = NOW()
         WHERE id = $2`,
        [price_chf, row.ai_product_id]
      )
    })

    // Record timeline event
    await appendIntakeEvent(id, {
      type: 'published',
      description: `Im Shop veröffentlicht für CHF ${price_chf.toFixed(2)}`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: { price_chf },
    })

    logger.info('Device published to marketplace', {
      inventoryId: id,
      price: price_chf,
      adminEmail: session.user.email,
    })

    return apiSuccess({ published: true, price_chf })
  } catch (error) {
    logger.error('Publish failed', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
