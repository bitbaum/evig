/**
 * Deliverable feedback API (internal / logged-in staff).
 *
 * POST  /api/deliverables/[id]/feedback  - add comment / change_request / approval
 * PATCH /api/deliverables/[id]/feedback  - resolve a change_request (status)
 *
 * External (no-login) feedback comes through /api/public/share/[token].
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createFeedbackSchema, updateFeedbackSchema } from '@/lib/schemas/deliverables'
import { getDeliverable, addFeedback, updateFeedbackStatus } from '@/lib/services/deliverables'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>('deliverables', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const result = createFeedbackSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const deliverable = await getDeliverable(id)
    if (!deliverable) return apiNotFound('Liefergegenstand')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const row = await addFeedback(id, {
      kind: result.data.kind,
      body: result.data.body,
      target: result.data.target,
      authorUserId: userLookup.dbUserId,
    })
    return apiSuccess(row, 201)
  } catch (error) {
    logger.error('Error adding deliverable feedback', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Speichern des Feedbacks')
  }
})

export const PATCH = withAdmin<RouteParams>('deliverables', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const result = updateFeedbackSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const ok = await updateFeedbackStatus(id, result.data.feedback_id, result.data.status)
    if (!ok) return apiNotFound('Feedback')
    return apiSuccess({ updated: true })
  } catch (error) {
    logger.error('Error updating deliverable feedback', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Aktualisieren des Feedbacks')
  }
})
