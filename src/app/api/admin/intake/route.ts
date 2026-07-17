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
import { apiError, apiSuccess , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, validateQuery } from '@/lib/schemas'
import { IntakeCreateSchema, IntakeQuerySchema } from '@/lib/schemas/intake'
import { INTAKE_STATUS } from '@/config/intake-status'
import { MARKETPLACE_STATUS, PRODUCT_STATUS } from '@/config/marketplace-status'
import { isChecklistComplete, hasChecklistFailure, getChecklistProgress, QUICK_CAPTURE_TIER } from '@/config/intake-checklist'
import type { ChecklistState } from '@/config/intake-checklist'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { syncProductToKivvi } from '@/lib/kivvi/sync-product'
import { logger } from '@/lib/logger'
import { appendIntakeEvent } from '@/lib/intake/timeline'
import {
  getTierForDestination,
  isUntestedShopDestination,
  type CaptureDestination,
} from '@/config/intake-workflow'

// POST — Unified intake: donation + erfassung in one transaction
export const POST = withAdmin('intake', async (request, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(IntakeCreateSchema, raw)
    if (!validation.success) return validation.error
    const data = validation.data
    const destination = data.destination as CaptureDestination | undefined
    const intakeTier = destination
      ? getTierForDestination(destination)
      : data.intake_tier
    const publishUntested = destination
      ? isUntestedShopDestination(destination)
      : false

    // Use unified product creation (SSOT) with intake-specific options
    const result = await db.transaction(async (tx) => {
      const created = await createErfassungProduct(
        {
          produktname: data.produktname,
          hersteller: data.hersteller,
          kurzbeschreibung: data.kurzbeschreibung,
          langtext: data.langtext,
          verkaufspreis: data.verkaufspreis || 0,
          zustand: data.zustand,
          laenge_mm: data.laenge_mm,
          breite_mm: data.breite_mm,
          hoehe_mm: data.hoehe_mm,
          gewicht_kg: data.gewicht_kg,
          location: data.location,
          storage_location_id: data.storage_location_id,
          box_id: data.box_id,
          auf_lager: data.auf_lager,
          hauptkategorie: data.hauptkategorie,
          unterkategorie: data.unterkategorie,
          kundenprofile: data.kundenprofile,
          image: data.image,
          action: publishUntested ? 'publish' : 'erfassen',
        },
        session.user.id,
        tx,
        {
          source: 'intake',
          intakeTier,
          existingDonationId: data.existing_donation_id,
          // Skip new-donation creation when linking to an existing one
          donation: !data.existing_donation_id && data.is_donation ? {
            donorName: data.donor_name,
            donorEmail: data.donor_email,
            notes: data.donor_notes,
            deviceCategory: data.hauptkategorie,
          } : undefined,
          checklistGated: Boolean(intakeTier),
          qcBypassReason: publishUntested ? data.qc_skip_reason : undefined,
        },
      )

      // These events are the auditable contract for the capture decision.
      // Keeping them in the same transaction prevents a published untested
      // item from existing without its required disclosure reason.
      await appendIntakeEvent(created.inventoryId, {
        type: 'created',
        description: `Gerät erfasst: ${data.hersteller} ${data.produktname}`,
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: {
          tier: intakeTier ?? null,
          destination: destination ?? data.intake_tier,
          is_donation: data.is_donation,
          item_uuid: created.itemUUID,
        },
      }, { executor: tx, required: true })

      if (publishUntested) {
        await appendIntakeEvent(created.inventoryId, {
          type: 'quality_skipped',
          description: 'Ohne RevampIT-Qualitätsprüfung veröffentlicht',
          userId: session.user.id,
          userEmail: session.user.email,
          metadata: { reason: data.qc_skip_reason },
        }, { executor: tx, required: true })
        await appendIntakeEvent(created.inventoryId, {
          type: 'published',
          description: `Ohne Prüfsiegel im Shop veröffentlicht für CHF ${(data.verkaufspreis || 0).toFixed(2)}`,
          userId: session.user.id,
          userEmail: session.user.email,
          metadata: { price_chf: data.verkaufspreis || 0, verified: false },
        }, { executor: tx, required: true })
      }

      return created
    })

    // Mirror the device to the Kivvi ERP only after product + audit commit.
    syncProductToKivvi({
      inventoryId: result.inventoryId,
      hersteller: data.hersteller,
      produktname: data.produktname,
      kurzbeschreibung: data.kurzbeschreibung,
      verkaufspreis: data.verkaufspreis,
      zustand: data.zustand,
    })

    logger.info('Device intake created', {
      itemUUID: result.itemUUID,
      tier: intakeTier ?? null,
      destination: destination ?? data.intake_tier,
      isDonation: data.is_donation,
      userId: session.user.id,
    })

    return apiSuccess({
      item_uuid: result.itemUUID,
      product_id: result.productId,
      inventory_id: result.inventoryId,
      donation_id: result.donationId,
      image_url: result.imageUrl,
      listing_id: result.listingId,
      destination: destination ?? data.intake_tier,
      published: result.listingId != null,
      verified: false,
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

    // The pipeline is the SSOT list of ALL captured devices — checklist-backed
    // physical work and tier-NULL inventory/untested records. The old base filter
    // `intake_tier IS NOT NULL` made quick-captured devices invisible in
    // every list, which read as "erfasst, aber verschwunden".
    //
    // Status buckets:
    //   in_progress — draft with an OPEN checklist (annahme items only)
    //   failed      — draft with a failed required checklist item (fix or re-tier)
    //   ready       — draft that is publishable (checklist done, or none)
    //   published   — live in the shop
    const STATUS_PREDICATES: Record<string, SQL> = {
      [INTAKE_STATUS.IN_PROGRESS]: sql`(ii.marketplace_status = ${MARKETPLACE_STATUS.DRAFT} AND ii.intake_tier IS NOT NULL AND ii.checklist_complete = false AND ii.checklist_failed = false)`,
      [INTAKE_STATUS.FAILED]: sql`(ii.marketplace_status = ${MARKETPLACE_STATUS.DRAFT} AND ii.checklist_failed = true)`,
      [INTAKE_STATUS.READY]: sql`(ii.marketplace_status = ${MARKETPLACE_STATUS.DRAFT} AND (ii.intake_tier IS NULL OR ii.checklist_complete = true) AND ii.checklist_failed = false)`,
      [INTAKE_STATUS.PUBLISHED]: sql`(ii.marketplace_status = ${MARKETPLACE_STATUS.PUBLISHED})`,
    }

    // Build dynamic conditions
    const conditions: SQL[] = []

    if (tier === QUICK_CAPTURE_TIER) {
      conditions.push(sql`ii.intake_tier IS NULL`)
    } else if (tier) {
      conditions.push(sql`ii.intake_tier = ${tier}`)
    }

    if (status && STATUS_PREDICATES[status]) {
      conditions.push(STATUS_PREDICATES[status])
    }

    if (category) {
      conditions.push(sql`ap.category = ${category}`)
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(sql`(ap.brand ILIKE ${pattern} OR ap.product_name ILIKE ${pattern})`)
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

    // Aggregate counts use base conditions only (no status filter) so stats
    // always reflect the full filtered set regardless of selected status tab.
    const baseConditions: SQL[] = []
    if (tier === QUICK_CAPTURE_TIER) {
      baseConditions.push(sql`ii.intake_tier IS NULL`)
    } else if (tier) {
      baseConditions.push(sql`ii.intake_tier = ${tier}`)
    }
    if (category) baseConditions.push(sql`ap.category = ${category}`)
    if (search) {
      const pattern = `%${search}%`
      baseConditions.push(sql`(ap.brand ILIKE ${pattern} OR ap.product_name ILIKE ${pattern})`)
    }
    const baseWhere = baseConditions.length > 0
      ? sql`WHERE ${sql.join(baseConditions, sql` AND `)}`
      : sql``

    // Items + filtered count + aggregate status counts — run in parallel
    const [itemsResult, countResult, statusCountsResult] = await Promise.all([
      db.execute(sql`
        SELECT
          ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
          ii.checklist_complete, ii.checklist_failed, ii.marketplace_status,
          ii.selling_price_chf, ii.source_donation_id, ii.created_at,
          ap.item_uuid, ap.product_name, ap.brand, ap.condition,
          ap.category, ap.subcategory, ap.short_description,
          u.name as created_by_name,
          d.donor_name
        FROM ${sql.raw(iiTable)} ii
        JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
        LEFT JOIN ${sql.raw(uTable)} u ON ap.created_by = u.id
        LEFT JOIN ${sql.raw(dTable)} d ON ii.source_donation_id = d.id
        ${whereClause}
        -- Operational work comes before history, and oldest work comes first
        -- so stuck devices cannot be buried by new arrivals.
        ORDER BY
          CASE WHEN ii.marketplace_status = ${MARKETPLACE_STATUS.PUBLISHED} THEN 1 ELSE 0 END,
          ii.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      db.execute(sql`
        SELECT COUNT(*) as total
        FROM ${sql.raw(iiTable)} ii
        JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
        LEFT JOIN ${sql.raw(dTable)} d ON ii.source_donation_id = d.id
        ${whereClause}
      `),
      db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE ${STATUS_PREDICATES[INTAKE_STATUS.IN_PROGRESS]}) AS in_progress,
          COUNT(*) FILTER (WHERE ${STATUS_PREDICATES[INTAKE_STATUS.FAILED]}) AS failed,
          COUNT(*) FILTER (WHERE ${STATUS_PREDICATES[INTAKE_STATUS.READY]}) AS ready,
          COUNT(*) FILTER (WHERE ${STATUS_PREDICATES[INTAKE_STATUS.PUBLISHED]}) AS published,
          COUNT(*) AS total_unfiltered
        FROM ${sql.raw(iiTable)} ii
        JOIN ${sql.raw(apTable)} ap ON ii.ai_product_id = ap.id
        LEFT JOIN ${sql.raw(dTable)} d ON ii.source_donation_id = d.id
        ${baseWhere}
      `),
    ])

    // Compute progress for each item. Quick-captured devices (tier NULL)
    // have no checklist — they count as complete/publishable immediately.
    interface IntakeRow {
      intake_checklist: ChecklistState | null
      intake_tier: string | null
      category: string | null
      [key: string]: unknown
    }
    const NO_CHECKLIST_PROGRESS = {
      completed: 0, total: 0, requiredCompleted: 0, requiredTotal: 0, failed: 0, percentage: 100,
    }
    const items = (itemsResult.rows as IntakeRow[]).map((row) => {
      if (!row.intake_tier) {
        return { ...row, checklist_progress: NO_CHECKLIST_PROGRESS, checklist_complete: true, checklist_failed: false }
      }
      const checklist = (row.intake_checklist || {}) as ChecklistState
      const tierVal = row.intake_tier as 'refurbish' | 'parts' | 'recycle'
      const cat = row.category
      const progress = getChecklistProgress(checklist, tierVal, cat)
      const complete = isChecklistComplete(checklist, tierVal, cat)
      const failed = hasChecklistFailure(checklist, tierVal, cat)
      return { ...row, checklist_progress: progress, checklist_complete: complete, checklist_failed: failed }
    })

    const total = parseInt((countResult.rows[0] as { total: string })?.total || '0')
    const sc = statusCountsResult.rows[0] as {
      in_progress: string; failed: string; ready: string; published: string; total_unfiltered: string
    } | undefined
    const statusCounts = {
      inProgress: parseInt(sc?.in_progress || '0'),
      failed: parseInt(sc?.failed || '0'),
      ready: parseInt(sc?.ready || '0'),
      published: parseInt(sc?.published || '0'),
      total: parseInt(sc?.total_unfiltered || '0'),
    }

    return apiSuccess({
      items,
      pagination: { total, limit, offset, hasMore: hasMoreItems(offset, limit, total) },
      statusCounts,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
