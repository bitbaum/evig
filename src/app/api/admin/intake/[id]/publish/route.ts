/**
 * Intake Publish API
 *
 * POST /api/admin/intake/[id]/publish — Publish device to marketplace
 * GATED: All required checklist items must be completed first.
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, eq, getTableName } from 'drizzle-orm'
import { aiExtractedProducts, inventoryItems } from '@/db/schema/inventory'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { IntakePublishSchema } from '@/lib/schemas/intake'
import { INTAKE_STATUS } from '@/config/intake-status'
import { isChecklistComplete, hasChecklistFailure, requiresQualityControl } from '@/config/intake-checklist'
import type { ChecklistState, IntakeTier } from '@/config/intake-checklist'
import { logger } from '@/lib/logger'
import { publishRevampitListing } from '@/lib/marketplace/publish-revampit-listing'
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
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(IntakePublishSchema, body)
    if (!validation.success) return validation.error
    const { price_chf, title, description } = validation.data

    // Get current state
    const iiTable = getTableName(inventoryItems)
    const apTable = getTableName(aiExtractedProducts)

    const existing = await db.execute(sql`
      SELECT ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
              ii.marketplace_status,
              ap.brand, ap.product_name, ap.short_description, ap.category
       FROM ${sql.raw(iiTable)} ii
       JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
       WHERE ii.id = ${id}
    `)

    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = existing.rows[0] as unknown as PublishRow

    // Gate: already published?
    if (row.marketplace_status === INTAKE_STATUS.PUBLISHED) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_ALREADY_PUBLISHED)
    }

    // Gate: quick-captured devices (tier NULL) skip the checklist ONLY for
    // categories that don't require QC (accessories). A laptop captured via
    // Schnellerfassung must go through the checklist before it can be sold.
    const tier = row.intake_tier as IntakeTier | null
    const checklist = (row.intake_checklist || {}) as ChecklistState
    if (!tier && requiresQualityControl(row.category)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_QC_REQUIRED)
    }

    // Gate: a failed required item blocks publishing until fixed or re-tiered.
    if (tier && hasChecklistFailure(checklist, tier, row.category)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_CHECKLIST_FAILED)
    }

    // Gate: all required checklist items must be done (pass or n.a.).
    if (tier && !isChecklistComplete(checklist, tier, row.category)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_CHECKLIST_INCOMPLETE)
    }

    // Publish in transaction
    const listingTitle = title || `${row.brand} ${row.product_name}`
    const listingDesc = description || row.short_description || ''

    await db.transaction(async (tx) => {
      // Update inventory item
      await tx.update(inventoryItems)
        .set({
          marketplaceStatus: INTAKE_STATUS.PUBLISHED,
          sellingPriceChf: String(price_chf),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(inventoryItems.id, id))

      // Update product estimated price (before publishing the listing so the
      // helper reads the right price from the product/inventory record).
      await tx.update(aiExtractedProducts)
        .set({
          estimatedPriceChf: String(price_chf),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(aiExtractedProducts.id, row.ai_product_id))

      // Publish to the unified marketplace as a RevampIT listing.
      await publishRevampitListing(tx, id, {
        priceChf: price_chf,
        title: listingTitle,
        description: listingDesc,
      })
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
