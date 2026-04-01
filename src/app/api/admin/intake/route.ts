/**
 * Intake API — Create + List
 *
 * POST /api/admin/intake — Unified device intake (creates inventory item + optional donation)
 * GET  /api/admin/intake — List pipeline items with filters
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName, SQL } from 'drizzle-orm'
import { aiExtractedProducts, inventoryItems, productImages } from '@/db/schema/inventory'
import { donations } from '@/db/schema/misc'
import { users } from '@/db/schema/auth'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, validateQuery } from '@/lib/schemas'
import { IntakeCreateSchema, IntakeQuerySchema } from '@/lib/schemas/intake'
import { INTAKE_STATUS } from '@/config/intake-status'
import { MARKETPLACE_STATUS, PRODUCT_STATUS } from '@/config/marketplace-status'
import { getChecklistForDevice, isChecklistComplete, getChecklistProgress } from '@/config/intake-checklist'
import type { ChecklistState } from '@/config/intake-checklist'
import { generateItemUUID } from '@/lib/erfassung/create-product'
import { uploadImage, generateImageFilename } from '@/lib/storage/image-upload'
import { logger } from '@/lib/logger'
import { appendIntakeEvent } from '@/lib/intake/timeline'

// POST — Unified intake: donation + erfassung in one transaction
export const POST = withAdmin('intake', async (request, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(IntakeCreateSchema, raw)
    if (!validation.success) return validation.error
    const data = validation.data

    const result = await db.transaction(async (tx) => {
      // 1. Generate Item UUID
      const itemUUID = await generateItemUUID(tx)

      // 2. Create ai_extracted_products entry
      const [productRow] = await tx.insert(aiExtractedProducts).values({
        itemUuid: itemUUID,
        productName: data.produktname,
        brand: data.hersteller,
        shortDescription: data.kurzbeschreibung || null,
        estimatedPriceChf: data.verkaufspreis ? String(data.verkaufspreis) : null,
        condition: data.zustand,
        category: data.hauptkategorie || null,
        subcategory: data.unterkategorie || null,
        status: PRODUCT_STATUS.APPROVED,
        sourceType: 'intake',
        createdBy: session.user.id,
      }).returning({ id: aiExtractedProducts.id })
      const productId = productRow.id

      // 3. Create donation record if this is a donation
      let donationId: string | null = null
      if (data.is_donation) {
        const [donationRow] = await tx.insert(donations).values({
          donationType: 'device',
          deviceCategory: data.hauptkategorie || 'other',
          deviceBrand: data.hersteller,
          deviceModel: data.produktname,
          deviceDescription: data.kurzbeschreibung || null,
          deviceCondition: data.zustand,
          donorName: data.donor_name || null,
          donorEmail: data.donor_email || null,
          notes: data.donor_notes || null,
          status: 'recorded',
          recordedBy: session.user.id,
        }).returning({ id: donations.id })
        donationId = donationRow.id
      }

      // 4. Initialize checklist state (all items for this tier+category, all unchecked)
      const checklistItems = getChecklistForDevice(data.intake_tier, data.hauptkategorie)
      const checklistState: ChecklistState = {}
      for (const item of checklistItems) {
        checklistState[item.id] = {
          completed: false,
          completedBy: null,
          completedAt: null,
          notes: '',
        }
      }

      // 5. Create inventory_items entry with intake metadata
      const [inventoryRow] = await tx.insert(inventoryItems).values({
        aiProductId: productId,
        quantityAvailable: 1,
        status: 'available',
        sellingPriceChf: data.verkaufspreis ? String(data.verkaufspreis) : null,
        marketplaceStatus: 'draft',
        intakeTier: data.intake_tier,
        intakeChecklist: checklistState,
        checklistComplete: false,
        sourceDonationId: donationId,
      }).returning({ id: inventoryItems.id })
      const inventoryId = inventoryRow.id

      // 6. Handle image upload if provided
      let imageUrl: string | null = null
      if (data.image) {
        const filename = generateImageFilename(itemUUID)
        const uploadResult = await uploadImage(data.image, filename, 'products')
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url
          await tx.insert(productImages).values({
            productId,
            filename,
            filePath: uploadResult.url,
            isPrimary: true,
            uploadedBy: session.user.id,
            uploadStatus: 'ready',
          })
        }
      }

      return { itemUUID, productId, inventoryId, donationId, imageUrl }
    })

    // Record timeline event
    await appendIntakeEvent(result.inventoryId, {
      type: 'created',
      description: `Gerät erfasst: ${data.hersteller} ${data.produktname} (${data.intake_tier})`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: {
        tier: data.intake_tier,
        is_donation: data.is_donation,
        item_uuid: result.itemUUID,
      },
    })

    logger.info('Device intake created', {
      itemUUID: result.itemUUID,
      tier: data.intake_tier,
      isDonation: data.is_donation,
      userId: session.user.id,
    })

    return apiSuccess({
      item_uuid: result.itemUUID,
      product_id: result.productId,
      inventory_id: result.inventoryId,
      donation_id: result.donationId,
      image_url: result.imageUrl,
    })
  } catch (error) {
    logger.error('Intake creation failed', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// GET — List pipeline items
export const GET = withAdmin('intake', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    const validation = validateQuery(IntakeQuerySchema, params)
    if (!validation.success) return validation.error
    const { limit, offset, tier, status, category, search } = validation.data

    // Table names from Drizzle schema
    const iiTable = getTableName(inventoryItems)
    const apTable = getTableName(aiExtractedProducts)
    const uTable = getTableName(users)
    const dTable = getTableName(donations)

    // Build dynamic conditions
    const conditions: SQL[] = [sql`ii.intake_tier IS NOT NULL`]

    if (tier) {
      conditions.push(sql`ii.intake_tier = ${tier}`)
    }

    if (status === INTAKE_STATUS.IN_PROGRESS) {
      conditions.push(sql`ii.checklist_complete = false AND ii.marketplace_status = ${MARKETPLACE_STATUS.DRAFT}`)
    } else if (status === INTAKE_STATUS.READY) {
      conditions.push(sql`ii.checklist_complete = true AND ii.marketplace_status = ${MARKETPLACE_STATUS.DRAFT}`)
    } else if (status === INTAKE_STATUS.PUBLISHED) {
      conditions.push(sql`ii.marketplace_status = ${INTAKE_STATUS.PUBLISHED}`)
    }

    if (category) {
      conditions.push(sql`ap.category = ${category}`)
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(sql`(ap.brand ILIKE ${pattern} OR ap.product_name ILIKE ${pattern})`)
    }

    const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`

    const itemsResult = await db.execute(sql`
      SELECT
        ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
        ii.checklist_complete, ii.marketplace_status, ii.selling_price_chf,
        ii.source_donation_id, ii.created_at,
        ap.item_uuid, ap.product_name, ap.brand, ap.condition,
        ap.category, ap.subcategory, ap.short_description,
        u.name as created_by_name,
        d.donor_name
      FROM ${sql.raw(iiTable)} ii
      JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
      LEFT JOIN ${sql.raw(uTable)} u ON ap.created_by = u.id
      LEFT JOIN ${sql.raw(dTable)} d ON ii.source_donation_id = d.id
      ${whereClause}
      ORDER BY ii.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Compute progress for each item
    interface IntakeRow {
      intake_checklist: ChecklistState | null
      intake_tier: string
      category: string | null
      [key: string]: unknown
    }
    const items = (itemsResult.rows as IntakeRow[]).map((row) => {
      const checklist = (row.intake_checklist || {}) as ChecklistState
      const tierVal = row.intake_tier as 'refurbish' | 'parts' | 'recycle'
      const cat = row.category
      const progress = getChecklistProgress(checklist, tierVal, cat)
      const complete = isChecklistComplete(checklist, tierVal, cat)
      return { ...row, checklist_progress: progress, checklist_complete: complete }
    })

    // Count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
       FROM ${sql.raw(iiTable)} ii
       JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
       LEFT JOIN ${sql.raw(dTable)} d ON ii.source_donation_id = d.id
       ${whereClause}
    `)
    const total = parseInt((countResult.rows[0] as { total: string })?.total || '0')

    return apiSuccess({
      items,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
