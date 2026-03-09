/**
 * Intake Tier Change API
 *
 * POST /api/admin/intake/[id]/change-tier — Change device tier with checklist reset.
 * Resets all checklist progress and records a timeline event.
 */

import { db } from '@/db'
import { inventoryItems, aiExtractedProducts } from '@/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { INTAKE_STATUS } from '@/config/intake-status'
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

export const POST = withAdmin<{ id: string }>('intake', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(TierChangeSchema, body)
    if (!validation.success) return validation.error
    const { new_tier, reason } = validation.data

    // Get current state
    const [row] = await db
      .select({
        id: inventoryItems.id,
        intakeTier: inventoryItems.intakeTier,
        marketplaceStatus: inventoryItems.marketplaceStatus,
        category: aiExtractedProducts.category,
      })
      .from(inventoryItems)
      .innerJoin(aiExtractedProducts, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(and(eq(inventoryItems.id, id), isNotNull(inventoryItems.intakeTier)))

    if (!row) {
      return apiNotFound(ERROR_MESSAGES.INTAKE_ITEM_NOT_FOUND)
    }

    const oldTier = row.intakeTier as IntakeTier

    if (row.marketplaceStatus === INTAKE_STATUS.PUBLISHED) {
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
    await db
      .update(inventoryItems)
      .set({
        intakeTier: new_tier,
        intakeChecklist: newChecklist,
        checklistComplete: false,
        updatedAt: sql`NOW()`,
      })
      .where(eq(inventoryItems.id, id))

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
