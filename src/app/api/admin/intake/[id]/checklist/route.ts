/**
 * Intake Checklist API
 *
 * PATCH /api/admin/intake/[id]/checklist — Toggle a checklist item
 */

import { db } from '@/db'
import { inventoryItems, aiExtractedProducts } from '@/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
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

export const PATCH = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(ChecklistUpdateSchema, body)
    if (!validation.success) return validation.error
    const { item_id, completed, notes } = validation.data

    // Get current state
    const [row] = await db
      .select({
        id: inventoryItems.id,
        intakeTier: inventoryItems.intakeTier,
        intakeChecklist: inventoryItems.intakeChecklist,
        category: aiExtractedProducts.category,
      })
      .from(inventoryItems)
      .innerJoin(aiExtractedProducts, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(and(eq(inventoryItems.id, id), isNotNull(inventoryItems.intakeTier)))

    if (!row) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const tier = row.intakeTier as IntakeTier
    const checklist = (row.intakeChecklist || {}) as ChecklistState

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
    await db
      .update(inventoryItems)
      .set({
        intakeChecklist: checklist,
        checklistComplete: complete,
        updatedAt: sql`NOW()`,
      })
      .where(eq(inventoryItems.id, id))

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
