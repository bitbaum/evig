/**
 * Intake Detail API
 *
 * GET   /api/admin/intake/[id] — Full device detail with checklist + donation
 * PATCH /api/admin/intake/[id] — Update device info
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { inventoryItems, aiExtractedProducts, users, donations } from '@/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { IntakeUpdateSchema } from '@/lib/schemas/intake'
import {
  getChecklistForDevice,
  getChecklistProgress,
  isChecklistComplete,
  CHECKLIST_CATEGORY_LABELS,
} from '@/config/intake-checklist'
import type { ChecklistState, IntakeTier } from '@/config/intake-checklist'
import { logger } from '@/lib/logger'
import { appendIntakeEvent } from '@/lib/intake/timeline'
import type { StoredIntakeEvent } from '@/lib/intake/timeline'

// GET — Full detail
export const GET = withAdmin<{ id: string }>('intake', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const rows = await db
      .select({
        id: inventoryItems.id,
        ai_product_id: inventoryItems.aiProductId,
        intake_tier: inventoryItems.intakeTier,
        intake_checklist: inventoryItems.intakeChecklist,
        checklist_complete: inventoryItems.checklistComplete,
        marketplace_status: inventoryItems.marketplaceStatus,
        selling_price_chf: inventoryItems.sellingPriceChf,
        source_donation_id: inventoryItems.sourceDonationId,
        location: inventoryItems.location,
        status: inventoryItems.status,
        created_at: inventoryItems.createdAt,
        intake_events: inventoryItems.intakeEvents,
        item_uuid: aiExtractedProducts.itemUuid,
        product_name: aiExtractedProducts.productName,
        brand: aiExtractedProducts.brand,
        short_description: aiExtractedProducts.shortDescription,
        condition: aiExtractedProducts.condition,
        category: aiExtractedProducts.category,
        subcategory: aiExtractedProducts.subcategory,
        estimated_price_chf: aiExtractedProducts.estimatedPriceChf,
        created_by_name: users.name,
        created_by_email: users.email,
        donor_name: donations.donorName,
        donor_email: donations.donorEmail,
        donor_notes: donations.notes,
        donation_status: donations.status,
      })
      .from(inventoryItems)
      .innerJoin(aiExtractedProducts, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .leftJoin(users, eq(aiExtractedProducts.createdBy, users.id))
      .leftJoin(donations, eq(inventoryItems.sourceDonationId, donations.id))
      .where(and(eq(inventoryItems.id, id), isNotNull(inventoryItems.intakeTier)))

    if (rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = rows[0]
    const tier = row.intake_tier as IntakeTier
    const checklist = (row.intake_checklist || {}) as ChecklistState
    const cat = row.category

    // Get applicable checklist items with their config + state
    const checklistItems = getChecklistForDevice(tier, cat)
    const checklistWithState = checklistItems.map(item => ({
      ...item,
      state: checklist[item.id] || { completed: false, completedBy: null, completedAt: null, notes: '' },
    }))

    // Group by category
    const grouped: Record<string, typeof checklistWithState> = {}
    for (const item of checklistWithState) {
      const key = item.category
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    }

    const progress = getChecklistProgress(checklist, tier, cat)
    const complete = isChecklistComplete(checklist, tier, cat)

    return apiSuccess({
      ...row,
      checklist_complete: complete,
      checklist_progress: progress,
      checklist_items: checklistWithState,
      checklist_grouped: Object.entries(grouped).map(([category, items]) => ({
        category,
        label: CHECKLIST_CATEGORY_LABELS[category as keyof typeof CHECKLIST_CATEGORY_LABELS] || category,
        items,
      })),
      intake_events: (row.intake_events || []) as StoredIntakeEvent[],
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// PATCH — Update device info
export const PATCH = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(IntakeUpdateSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    // Check exists
    const [existing] = await db
      .select({ id: inventoryItems.id, aiProductId: inventoryItems.aiProductId })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), isNotNull(inventoryItems.intakeTier)))

    if (!existing) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const productId = existing.aiProductId

    // Update product fields if provided
    const productUpdate: Record<string, unknown> = {}
    if (data.hersteller !== undefined) productUpdate.brand = data.hersteller
    if (data.produktname !== undefined) productUpdate.productName = data.produktname
    if (data.kurzbeschreibung !== undefined) productUpdate.shortDescription = data.kurzbeschreibung
    if (data.verkaufspreis !== undefined) productUpdate.estimatedPriceChf = data.verkaufspreis
    if (data.zustand !== undefined) productUpdate.condition = data.zustand
    if (data.hauptkategorie !== undefined) productUpdate.category = data.hauptkategorie
    if (data.unterkategorie !== undefined) productUpdate.subcategory = data.unterkategorie

    // Update inventory fields if provided
    const invUpdate: Record<string, unknown> = {}
    if (data.intake_tier !== undefined) invUpdate.intakeTier = data.intake_tier
    if (data.verkaufspreis !== undefined) invUpdate.sellingPriceChf = data.verkaufspreis

    // Product update, inventory update, and timeline event are all independent — run in parallel
    const updatedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined)
    if (Object.keys(productUpdate).length > 0 && productId) productUpdate.updatedAt = sql`NOW()`
    if (Object.keys(invUpdate).length > 0) invUpdate.updatedAt = sql`NOW()`

    await Promise.all([
      Object.keys(productUpdate).length > 0 && productId
        ? db.update(aiExtractedProducts).set(productUpdate).where(eq(aiExtractedProducts.id, productId))
        : Promise.resolve(),
      Object.keys(invUpdate).length > 0
        ? db.update(inventoryItems).set(invUpdate).where(eq(inventoryItems.id, id))
        : Promise.resolve(),
      appendIntakeEvent(id, {
        type: 'field_updated',
        description: `Felder aktualisiert: ${updatedFields.join(', ')}`,
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: { fields: updatedFields },
      }),
    ])

    logger.info('Intake item updated', {
      inventoryId: id,
      adminEmail: session.user.email,
      fields: updatedFields,
    })

    return apiSuccess({ updated: true })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
