/**
 * Intake Tier Change API
 *
 * POST /api/admin/intake/[id]/change-tier — Change device tier with checklist reset.
 * Resets all checklist progress and records a timeline event.
 */

import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { validateBody } from '@/lib/schemas'
import { INTAKE_TIERS, getChecklistForDevice } from '@/config/intake-checklist'
import type { ChecklistState, IntakeTier } from '@/config/intake-checklist'
import { appendIntakeEvent } from '@/lib/intake/timeline'

const TierChangeSchema = z.object({
  new_tier: z.enum([INTAKE_TIERS.REFURBISH, INTAKE_TIERS.PARTS, INTAKE_TIERS.RECYCLE]),
  reason: z.string().min(1, 'Begründung erforderlich'),
})

interface TierRow {
  id: string
  intake_tier: string
  marketplace_status: string
  category: string | null
}

export const POST = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(TierChangeSchema, body)
    if (!validation.success) return validation.error
    const { new_tier, reason } = validation.data

    // Get current state
    const existing = await query<TierRow>(
      `SELECT ii.id, ii.intake_tier, ii.marketplace_status, ap.category
       FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
       WHERE ii.id = $1 AND ii.intake_tier IS NOT NULL`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = existing.rows[0]
    const oldTier = row.intake_tier as IntakeTier

    if (row.marketplace_status === 'published') {
      return apiBadRequest('Stufe kann nicht geändert werden — Gerät ist bereits publiziert')
    }

    if (oldTier === new_tier) {
      return apiBadRequest('Neue Stufe ist identisch mit aktueller Stufe')
    }

    // Build fresh checklist for new tier
    const checklistItems = getChecklistForDevice(new_tier, row.category)
    const newChecklist: ChecklistState = {}
    for (const item of checklistItems) {
      newChecklist[item.id] = {
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: '',
      }
    }

    // Update tier + reset checklist
    await query(
      `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
       SET intake_tier = $1, intake_checklist = $2, checklist_complete = false, updated_at = NOW()
       WHERE id = $3`,
      [new_tier, JSON.stringify(newChecklist), id]
    )

    // Record timeline event
    await appendIntakeEvent(id, {
      type: 'tier_changed',
      description: `Stufe geändert: ${oldTier} → ${new_tier}. Grund: ${reason}`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: { old_tier: oldTier, new_tier, reason },
    })

    logger.info('Intake tier changed', {
      inventoryId: id,
      oldTier,
      newTier: new_tier,
      reason,
      adminEmail: session.user.email,
    })

    return apiSuccess({
      old_tier: oldTier,
      new_tier,
      checklist_reset: true,
      checklist_items_count: checklistItems.length,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
