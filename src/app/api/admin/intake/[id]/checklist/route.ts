/**
 * Intake Checklist API
 *
 * PATCH /api/admin/intake/[id]/checklist — Toggle a checklist item
 */

import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { ChecklistUpdateSchema } from '@/lib/schemas/intake'
import {
  getChecklistForDevice,
  isChecklistComplete,
  getChecklistProgress,
} from '@/config/intake-checklist'
import type { ChecklistState, IntakeTier } from '@/config/intake-checklist'
import { logger } from '@/lib/logger'
import { appendIntakeEvent } from '@/lib/intake/timeline'

interface InventoryRow {
  id: string
  intake_tier: string
  intake_checklist: ChecklistState
  category: string | null
}

export const PATCH = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(ChecklistUpdateSchema, body)
    if (!validation.success) return validation.error
    const { item_id, completed, notes } = validation.data

    // Get current state
    const existing = await query<InventoryRow>(
      `SELECT ii.id, ii.intake_tier, ii.intake_checklist, ap.category
       FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} ap ON ii.ai_product_id = ap.id
       WHERE ii.id = $1 AND ii.intake_tier IS NOT NULL`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const row = existing.rows[0]
    const tier = row.intake_tier as IntakeTier
    const checklist = (row.intake_checklist || {}) as ChecklistState

    // Validate that item_id is a valid checklist item for this device
    const applicableItems = getChecklistForDevice(tier, row.category)
    const itemConfig = applicableItems.find(i => i.id === item_id)
    if (!itemConfig) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_INVALID_CHECKLIST_ITEM)
    }

    // Update checklist state
    checklist[item_id] = {
      completed,
      completedBy: completed ? session.user.id : null,
      completedAt: completed ? new Date().toISOString() : null,
      notes: notes || checklist[item_id]?.notes || '',
    }

    // Check if all required items are now complete
    const complete = isChecklistComplete(checklist, tier, row.category)
    const progress = getChecklistProgress(checklist, tier, row.category)

    // Persist
    await query(
      `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
       SET intake_checklist = $1, checklist_complete = $2, updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(checklist), complete, id]
    )

    // Record timeline event
    await appendIntakeEvent(id, {
      type: 'checklist_toggled',
      description: `${itemConfig.label}: ${completed ? 'erledigt' : 'rückgängig'}`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: { item_id, item_label: itemConfig.label, completed },
    })

    logger.info('Checklist item toggled', {
      inventoryId: id,
      itemId: item_id,
      completed,
      checklistComplete: complete,
      adminEmail: session.user.email,
    })

    return apiSuccess({
      checklist,
      checklist_complete: complete,
      checklist_progress: progress,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
