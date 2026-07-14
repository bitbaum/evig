import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { updateMetricSchema } from '@/lib/schemas/teams'
import { updateMetric, deleteMetric } from '@/lib/services/team-coordination'
import { logger } from '@/lib/logger'

type Params = { id: string; metricId: string }

/** Edit a KPI metric (value / target / unit / direction). */
export const PATCH = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, metricId } = context!.params!
    const body = await request.json()
    const result = updateMetricSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const ok = await updateMetric(id, metricId, result.data)
    if (!ok) return apiNotFound('Kennzahl')
    return apiSuccess({ updated: true })
  } catch (error) {
    logger.error('Error updating team metric', { error })
    return apiError(error, 'Fehler beim Aktualisieren der Kennzahl')
  }
})

/** Delete a KPI metric. */
export const DELETE = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, metricId } = context!.params!
    const ok = await deleteMetric(id, metricId)
    if (!ok) return apiNotFound('Kennzahl')
    return apiSuccess({ removed: true })
  } catch (error) {
    logger.error('Error deleting team metric', { error })
    return apiError(error, 'Fehler beim Löschen der Kennzahl')
  }
})
