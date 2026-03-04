/**
 * Intake Detail API
 *
 * GET   /api/admin/intake/[id] — Full device detail with checklist + donation
 * PATCH /api/admin/intake/[id] — Update device info
 */

import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
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

interface IntakeDetailRow {
  id: string
  ai_product_id: string
  intake_tier: string
  intake_checklist: ChecklistState
  checklist_complete: boolean
  marketplace_status: string
  selling_price_chf: number | null
  source_donation_id: string | null
  location: string | null
  status: string
  created_at: string
  item_uuid: string
  product_name: string
  brand: string
  short_description: string | null
  condition: string
  category: string | null
  subcategory: string | null
  estimated_price_chf: number | null
  created_by_name: string | null
  created_by_email: string | null
  donor_name: string | null
  donor_email: string | null
  donor_notes: string | null
  donation_status: string | null
  intake_events: StoredIntakeEvent[] | null
}

// GET — Full detail
export const GET = withAdmin<{ id: string }>('intake', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const result = await query<IntakeDetailRow>(
      `SELECT
        ii.id, ii.ai_product_id, ii.intake_tier, ii.intake_checklist,
        ii.checklist_complete, ii.marketplace_status, ii.selling_price_chf,
        ii.source_donation_id, ii.location, ii.status, ii.created_at, ii.intake_events,
        ap.item_uuid, ap.product_name, ap.brand, ap.short_description,
        ap.condition, ap.category, ap.subcategory, ap.estimated_price_chf,
        u.name as created_by_name, u.email as created_by_email,
        d.donor_name, d.donor_email, d.notes as donor_notes, d.status as donation_status
      FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
      JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
      LEFT JOIN ${TABLE_NAMES.USERS} u ON ap.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.DONATIONS} d ON ii.source_donation_id = d.id
      WHERE ii.id = $1 AND ii.intake_tier IS NOT NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = result.rows[0]
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
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(IntakeUpdateSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    // Check exists
    const existing = await query<{ id: string; ai_product_id: string }>(
      `SELECT ii.id, ii.ai_product_id FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       WHERE ii.id = $1 AND ii.intake_tier IS NOT NULL`,
      [id]
    )
    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const productId = existing.rows[0].ai_product_id

    // Update product fields if provided
    const productFields: string[] = []
    const productParams: (string | number | null)[] = []
    let paramIndex = 1

    if (data.hersteller !== undefined) {
      productFields.push(`brand = $${paramIndex++}`)
      productParams.push(data.hersteller)
    }
    if (data.produktname !== undefined) {
      productFields.push(`product_name = $${paramIndex++}`)
      productParams.push(data.produktname)
    }
    if (data.kurzbeschreibung !== undefined) {
      productFields.push(`short_description = $${paramIndex++}`)
      productParams.push(data.kurzbeschreibung)
    }
    if (data.verkaufspreis !== undefined) {
      productFields.push(`estimated_price_chf = $${paramIndex++}`)
      productParams.push(data.verkaufspreis)
    }
    if (data.zustand !== undefined) {
      productFields.push(`condition = $${paramIndex++}`)
      productParams.push(data.zustand)
    }
    if (data.hauptkategorie !== undefined) {
      productFields.push(`category = $${paramIndex++}`)
      productParams.push(data.hauptkategorie)
    }
    if (data.unterkategorie !== undefined) {
      productFields.push(`subcategory = $${paramIndex++}`)
      productParams.push(data.unterkategorie)
    }

    if (productFields.length > 0) {
      productFields.push(`updated_at = NOW()`)
      productParams.push(productId)
      await query(
        `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
         SET ${productFields.join(', ')}
         WHERE id = $${paramIndex}`,
        productParams
      )
    }

    // Update inventory fields if provided
    const inventoryFields: string[] = []
    const inventoryParams: (string | number | null)[] = []
    let invIndex = 1

    if (data.intake_tier !== undefined) {
      inventoryFields.push(`intake_tier = $${invIndex++}`)
      inventoryParams.push(data.intake_tier)
    }
    if (data.verkaufspreis !== undefined) {
      inventoryFields.push(`selling_price_chf = $${invIndex++}`)
      inventoryParams.push(data.verkaufspreis)
    }

    if (inventoryFields.length > 0) {
      inventoryFields.push(`updated_at = NOW()`)
      inventoryParams.push(id)
      await query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET ${inventoryFields.join(', ')}
         WHERE id = $${invIndex}`,
        inventoryParams
      )
    }

    // Record timeline event
    const updatedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined)
    await appendIntakeEvent(id, {
      type: 'field_updated',
      description: `Felder aktualisiert: ${updatedFields.join(', ')}`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: { fields: updatedFields },
    })

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
