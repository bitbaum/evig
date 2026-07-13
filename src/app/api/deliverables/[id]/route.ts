/**
 * Deliverable detail API
 *
 * GET    /api/deliverables/[id] - deliverable + feedback thread
 * PATCH  /api/deliverables/[id] - update fields / status
 * DELETE /api/deliverables/[id] - delete (cascades feedback)
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { updateDeliverableSchema } from '@/lib/schemas/deliverables'
import {
  getDeliverable,
  getFeedback,
  updateDeliverable,
  deleteDeliverable,
} from '@/lib/services/deliverables'
import { ingestDeliverable } from '@/lib/deliverables/ai'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAdmin<RouteParams>('deliverables', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const deliverable = await getDeliverable(id)
    if (!deliverable) return apiNotFound('Liefergegenstand')

    const feedback = await getFeedback(id)
    return apiSuccess({ deliverable, feedback })
  } catch (error) {
    logger.error('Error fetching deliverable', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden des Liefergegenstands')
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
    const result = updateDeliverableSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const existing = await getDeliverable(id)
    if (!existing) return apiNotFound('Liefergegenstand')

    const updated = await updateDeliverable(id, result.data as Record<string, unknown>)

    // Re-index into the Hirn RAG store (best-effort; content may have changed).
    if (updated) {
      ingestDeliverable(updated).catch((error) =>
        logger.warn('Deliverable ingest-on-update failed', { error, id }),
      )
    }

    return apiSuccess(updated)
  } catch (error) {
    logger.error('Error updating deliverable', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Aktualisieren des Liefergegenstands')
  }
})

export const DELETE = withAdmin<RouteParams>('deliverables', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const ok = await deleteDeliverable(id)
    if (!ok) return apiNotFound('Liefergegenstand')
    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Error deleting deliverable', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Löschen des Liefergegenstands')
  }
})
