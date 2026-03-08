/**
 * Intake API — Create + List
 *
 * POST /api/admin/intake — Unified device intake (creates inventory item + optional donation)
 * GET  /api/admin/intake — List pipeline items with filters
 */

import { withAdmin } from '@/lib/api/middleware'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody, validateQuery } from '@/lib/schemas'
import { IntakeCreateSchema, IntakeQuerySchema } from '@/lib/schemas/intake'
import { INTAKE_STATUS } from '@/config/intake-status'
import { getChecklistForDevice, isChecklistComplete, getChecklistProgress } from '@/config/intake-checklist'
import type { ChecklistState } from '@/config/intake-checklist'
import { generateItemUUID } from '@/lib/erfassung/create-product'
import { uploadImage, generateImageFilename } from '@/lib/storage/image-upload'
import { logger } from '@/lib/logger'
import { CountRow } from '@/lib/api/db-types'
import { appendIntakeEvent } from '@/lib/intake/timeline'

// POST — Unified intake: donation + erfassung in one transaction
export const POST = withAdmin('intake', async (request, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(IntakeCreateSchema, raw)
    if (!validation.success) return validation.error
    const data = validation.data

    const result = await transaction(async (client) => {
      // 1. Generate Item UUID
      const itemUUID = await generateItemUUID(client)

      // 2. Create ai_extracted_products entry
      const productResult = await client.query(
        `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
          item_uuid, product_name, brand, short_description,
          estimated_price_chf, condition, category, subcategory,
          status, source_type, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', 'intake', $9)
        RETURNING id`,
        [
          itemUUID,
          data.produktname,
          data.hersteller,
          data.kurzbeschreibung || null,
          data.verkaufspreis || null,
          data.zustand,
          data.hauptkategorie || null,
          data.unterkategorie || null,
          session.user.id,
        ]
      )
      const productId = productResult.rows[0].id

      // 3. Create donation record if this is a donation
      let donationId: string | null = null
      if (data.is_donation) {
        const donationResult = await client.query(
          `INSERT INTO ${TABLE_NAMES.DONATIONS} (
            donation_type, device_category, device_brand, device_model,
            device_description, device_condition,
            donor_name, donor_email, notes,
            status, recorded_by
          ) VALUES ('device', $1, $2, $3, $4, $5, $6, $7, $8, 'recorded', $9)
          RETURNING id`,
          [
            data.hauptkategorie || 'other',
            data.hersteller,
            data.produktname,
            data.kurzbeschreibung || null,
            data.zustand,
            data.donor_name || null,
            data.donor_email || null,
            data.donor_notes || null,
            session.user.id,
          ]
        )
        donationId = donationResult.rows[0].id
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
      const inventoryResult = await client.query(
        `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
          ai_product_id, quantity_available, status,
          selling_price_chf, marketplace_status,
          intake_tier, intake_checklist, checklist_complete, source_donation_id
        ) VALUES ($1, 1, 'available', $2, 'draft', $3, $4, false, $5)
        RETURNING id`,
        [
          productId,
          data.verkaufspreis || null,
          data.intake_tier,
          JSON.stringify(checklistState),
          donationId,
        ]
      )
      const inventoryId = inventoryResult.rows[0].id

      // 6. Handle image upload if provided
      let imageUrl: string | null = null
      if (data.image) {
        const filename = generateImageFilename(itemUUID)
        const uploadResult = await uploadImage(data.image, filename, 'products')
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url
          await client.query(
            `INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
              product_id, filename, file_path, is_primary, uploaded_by, upload_status
            ) VALUES ($1, $2, $3, true, $4, 'ready')`,
            [productId, filename, uploadResult.url, session.user.id]
          )
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

    const conditions: string[] = ['ii.intake_tier IS NOT NULL']
    const queryParams: (string | number)[] = []

    if (tier) {
      queryParams.push(tier)
      conditions.push(`ii.intake_tier = $${queryParams.length}`)
    }

    if (status === INTAKE_STATUS.IN_PROGRESS) {
      conditions.push(`ii.checklist_complete = false AND ii.marketplace_status = 'draft'`)
    } else if (status === INTAKE_STATUS.READY) {
      conditions.push(`ii.checklist_complete = true AND ii.marketplace_status = 'draft'`)
    } else if (status === INTAKE_STATUS.PUBLISHED) {
      conditions.push(`ii.marketplace_status = '${INTAKE_STATUS.PUBLISHED}'`)
    }

    if (category) {
      queryParams.push(category)
      conditions.push(`ap.category = $${queryParams.length}`)
    }

    if (search) {
      queryParams.push(`%${search}%`)
      conditions.push(`(ap.brand ILIKE $${queryParams.length} OR ap.product_name ILIKE $${queryParams.length})`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    queryParams.push(limit, offset)
    const itemsResult = await query(
      `SELECT
        ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
        ii.checklist_complete, ii.marketplace_status, ii.selling_price_chf,
        ii.source_donation_id, ii.created_at,
        ap.item_uuid, ap.product_name, ap.brand, ap.condition,
        ap.category, ap.subcategory, ap.short_description,
        u.name as created_by_name,
        d.donor_name
      FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
      JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
      LEFT JOIN ${TABLE_NAMES.USERS} u ON ap.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.DONATIONS} d ON ii.source_donation_id = d.id
      ${whereClause}
      ORDER BY ii.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    )

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
    const countParams = queryParams.slice(0, -2)
    const countResult = await query<CountRow>(
      `SELECT COUNT(*) as total
       FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
       LEFT JOIN ${TABLE_NAMES.DONATIONS} d ON ii.source_donation_id = d.id
       ${whereClause}`,
      countParams
    )
    const total = parseInt(countResult.rows[0]?.total || '0')

    return apiSuccess({
      items,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
