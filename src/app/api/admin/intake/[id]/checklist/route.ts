/**
 * Intake Checklist API
 *
 * PATCH /api/admin/intake/[id]/checklist — Set a verdict (pass/fail/na) on one
 * checklist item, or the same verdict on many (`item_ids`, used by
 * "Alles in Ordnung").
 *
 * All writes serialize on a row lock: the checklist is one JSONB column, so
 * unlocked concurrent read-modify-writes silently drop each other's items
 * (the "Alles in Ordnung needs four clicks" bug).
 */

import { db } from '@/db'
import { inventoryItems, aiExtractedProducts } from '@/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { MARKETPLACE_STATUS } from '@/config/marketplace-status'
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
    const { item_id, item_ids, result, notes, second_person_override } = validation.data
    const targetIds = item_ids ?? (item_id ? [item_id] : [])
    const isBulk = Boolean(item_ids)

    // Device context (tier + category) — read outside the lock; it never
    // changes concurrently with verdicts.
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

    const tier = row.intakeTier as IntakeTier

    // Publication snapshots QC results onto the buyer-facing listing. Keep the
    // source checklist immutable afterwards so those two records cannot drift.
    if (row.marketplaceStatus === MARKETPLACE_STATUS.PUBLISHED) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_ALREADY_PUBLISHED)
    }

    // Validate every target against this device's checklist
    const applicableItems = getChecklistForDevice(tier, row.category)
    const targetConfigs = targetIds.map(tid => applicableItems.find(i => i.id === tid))
    if (targetConfigs.some(c => !c)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_INVALID_CHECKLIST_ITEM)
    }
    // Bulk marking never signs off a deliberate-second-person item (final QA)
    // — that verdict stays an individual, attributable action.
    if (isBulk && targetConfigs.some(c => c?.requiresSecondPerson)) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_INVALID_CHECKLIST_ITEM)
    }

    // All verdict writes serialize here (SELECT … FOR UPDATE): concurrent
    // PATCHes queue on the row instead of overwriting each other's JSONB.
    const outcome = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ intakeChecklist: inventoryItems.intakeChecklist })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id))
        .for('update')

      const checklist = (locked?.intakeChecklist || {}) as ChecklistState

      // Idempotent no-op: repeat taps must not grow the audit timeline or
      // rewrite completedBy/completedAt.
      const changedIds = targetIds.filter(tid => {
        const existing = checklist[tid]
        if (!existing) return true
        if (existing.result !== result) return true
        return Boolean(notes && notes !== existing.notes)
      })

      if (changedIds.length === 0) {
        return { changedIds, checklist, secondPersonViolation: false }
      }

      // Vier-Augen-Prinzip: final QA can't be signed off (pass or n.a.) by the
      // majority worker. A solo-shift exception must be explicit; a generic
      // checklist note must never silently become an override.
      // Recording a FAIL is always allowed — flagging a problem is never blocked.
      const finalQaConfig = !isBulk ? targetConfigs[0] : undefined
      const secondPersonViolation =
        !isBulk &&
        result !== null &&
        result !== CHECKLIST_RESULTS.FAIL &&
        finalQaConfig !== undefined &&
        violatesSecondPersonRule(finalQaConfig, checklist, tier, row.category, session.user.id)

      if (secondPersonViolation && !second_person_override) {
        return { blocked: true as const, changedIds, checklist, secondPersonViolation }
      }

      const completedAt = new Date().toISOString()
      for (const tid of changedIds) {
        checklist[tid] = {
          result,
          completedBy: result ? session.user.id : null,
          completedAt: result ? completedAt : null,
          notes: (!isBulk && notes) || checklist[tid]?.notes || '',
        }
      }

      await tx
        .update(inventoryItems)
        .set({
          intakeChecklist: checklist,
          checklistComplete: isChecklistComplete(checklist, tier, row.category),
          checklistFailed: hasChecklistFailure(checklist, tier, row.category),
          updatedAt: sql`NOW()`,
        })
        .where(eq(inventoryItems.id, id))

      return { changedIds, checklist, secondPersonViolation }
    })

    if ('blocked' in outcome && outcome.blocked) {
      return apiBadRequest(ERROR_MESSAGES.INTAKE_SECOND_PERSON_REQUIRED)
    }

    const { changedIds, checklist, secondPersonViolation } = outcome
    const complete = isChecklistComplete(checklist, tier, row.category)
    const failed = hasChecklistFailure(checklist, tier, row.category)
    const progress = getChecklistProgress(checklist, tier, row.category)

    // Audit trail: one event per user action — a bulk pass is ONE action.
    if (changedIds.length > 0) {
      const resultLabel = result ? CHECKLIST_RESULT_LABELS[result] : 'zurückgesetzt'
      const overrideSuffix = secondPersonViolation && second_person_override
        ? ` — Ausnahme Vier-Augen-Prinzip: ${(notes ?? '').trim()}`
        : ''
      const description = isBulk
        ? `${changedIds.length} Prüfpunkte: ${resultLabel}`
        : `${targetConfigs[0]?.label}: ${resultLabel}${result === 'fail' && notes ? ` — ${notes}` : ''}${overrideSuffix}`
      await appendIntakeEvent(id, {
        type: 'checklist_toggled',
        description,
        userId: session.user.id,
        userEmail: session.user.email,
        metadata: {
          item_ids: changedIds,
          result,
          second_person_override: secondPersonViolation && Boolean(second_person_override),
        },
      })

      logger.info('Checklist verdict set', {
        inventoryId: id,
        itemIds: changedIds,
        result,
        checklistComplete: complete,
        checklistFailed: failed,
        adminEmail: session.user.email,
      })
    }

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
