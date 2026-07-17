/**
 * Intake Detail API
 *
 * GET   /api/admin/intake/[id] — Full device detail with checklist + donation
 * PATCH /api/admin/intake/[id] — Update device info
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { inventoryItems, aiExtractedProducts, users, donations, productImages, listings } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { IntakeUpdateSchema } from '@/lib/schemas/intake'
import {
  getChecklistForDevice,
  getChecklistProgress,
  isChecklistComplete,
  hasChecklistFailure,
  normalizeChecklistItemState,
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
      // No intake_tier gate: quick-captured devices (tier NULL, no checklist)
      // are part of the same pipeline and must open in the detail view too.
      .where(eq(inventoryItems.id, id))

    if (rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = rows[0]

    // Primary product image — the detail page shows the device, not just text.
    let imageUrl: string | null = null
    if (row.ai_product_id) {
      const [img] = await db
        .select({ filePath: productImages.filePath })
        .from(productImages)
        .where(and(eq(productImages.productId, row.ai_product_id), eq(productImages.isPrimary, true)))
        .limit(1)
      imageUrl = img?.filePath ?? null
    }

    // Published devices link straight to their live listing — "is it in the
    // shop?" must be answerable (and clickable) from this page.
    const [listing] = await db
      .select({ id: listings.id, status: listings.status })
      .from(listings)
      .where(eq(listings.inventoryItemId, id))
      .limit(1)

    const tier = row.intake_tier as IntakeTier | null
    const checklist = (row.intake_checklist || {}) as ChecklistState
    const cat = row.category

    // Get applicable checklist items with their config + state.
    // Quick-captured devices have no checklist — empty list, complete=true.
    const checklistItems = tier ? getChecklistForDevice(tier, cat) : []
    const checklistWithState = checklistItems.map(item => ({
      ...item,
      state: normalizeChecklistItemState(checklist[item.id]),
    }))

    // Group by category
    const grouped: Record<string, typeof checklistWithState> = {}
    for (const item of checklistWithState) {
      const key = item.category
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    }

    const progress = tier
      ? getChecklistProgress(checklist, tier, cat)
      : { completed: 0, total: 0, requiredCompleted: 0, requiredTotal: 0, failed: 0, percentage: 100 }
    const complete = tier ? isChecklistComplete(checklist, tier, cat) : true
    const checklistFailed = tier ? hasChecklistFailure(checklist, tier, cat) : false

    return apiSuccess({
      ...row,
      image_url: imageUrl,
      listing_id: listing?.id ?? null,
      listing_status: listing?.status ?? null,
      checklist_complete: complete,
      checklist_failed: checklistFailed,
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

    // Check exists — quick-captured devices (tier NULL) are editable too.
    const [existing] = await db
      .select({ id: inventoryItems.id, aiProductId: inventoryItems.aiProductId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))

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
