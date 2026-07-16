/**
 * Intake Checklist API
 *
 * PATCH /api/admin/intake/[id]/checklist — Set a verdict (pass/fail/na) on a checklist item
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
  hasChecklistFailure,
  getChecklistProgress,
  violatesSecondPersonRule,
  CHECKLIST_RESULTS,
  CHECKLIST_RESULT_LABELS,
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
    const { item_id, result, notes } = validation.data

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

    // Vier-Augen-Prinzip: final QA can't be signed off (pass or n.a.) by the
    // person who did all the other required work. Recording a FAIL is always
    // allowed — flagging a problem must never be blocked.
    if (
      result !== null &&
      result !== CHECKLIST_RESULTS.FAIL &&
      violatesSecondPersonRule(itemConfig, checklist, tier, row.category, session.user.id)
    ) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_SECOND_PERSON_REQUIRED)
    }

    // Update checklist state (result=null resets the item to open)
    checklist[item_id] = {
      result,
      completedBy: result ? session.user.id : null,
      completedAt: result ? new Date().toISOString() : null,
      notes: notes || checklist[item_id]?.notes || '',
    }

    // Recompute the cached pipeline flags
    const complete = isChecklistComplete(checklist, tier, row.category)
    const failed = hasChecklistFailure(checklist, tier, row.category)
    const progress = getChecklistProgress(checklist, tier, row.category)

    // Persist
    await db
      .update(inventoryItems)
      .set({
        intakeChecklist: checklist,
        checklistComplete: complete,
        checklistFailed: failed,
        updatedAt: sql`NOW()`,
      })
      .where(eq(inventoryItems.id, id))

    // Record timeline event
    const resultLabel = result ? CHECKLIST_RESULT_LABELS[result] : 'zurückgesetzt'
    await appendIntakeEvent(id, {
      type: 'checklist_toggled',
      description: `${itemConfig.label}: ${resultLabel}${result === 'fail' && notes ? ` — ${notes}` : ''}`,
      userId: session.user.id,
      userEmail: session.user.email,
      metadata: { item_id, item_label: itemConfig.label, result },
    })

    logger.info('Checklist verdict set', {
      inventoryId: id,
      itemId: item_id,
      result,
      checklistComplete: complete,
      checklistFailed: failed,
      adminEmail: session.user.email,
    })

    return apiSuccess({
      checklist,
      checklist_complete: complete,
      checklist_failed: failed,
      checklist_progress: progress,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
