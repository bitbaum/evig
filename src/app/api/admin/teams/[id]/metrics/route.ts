import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { createMetricSchema } from '@/lib/schemas/teams'
import { listMetrics, createMetric } from '@/lib/services/team-coordination'
import { logger } from '@/lib/logger'

type Params = { id: string }

/** List a team's KPI metrics. */
export const GET = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    return apiSuccess(await listMetrics(context!.params!.id))
  } catch (error) {
    logger.error('Error listing team metrics', { error })
    return apiError(error, 'Fehler beim Laden der Kennzahlen')
  }
})

/** Add a KPI metric. */
export const POST = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const body = await request.json()
    const result = createMetricSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    return apiSuccess(await createMetric(context!.params!.id, result.data), 201)
  } catch (error) {
    logger.error('Error creating team metric', { error })
    return apiError(error, 'Fehler beim Erstellen der Kennzahl')
  }
})
