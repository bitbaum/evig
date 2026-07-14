import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { createGoalSchema } from '@/lib/schemas/teams'
import { listGoals, createGoal } from '@/lib/services/team-coordination'
import { logger } from '@/lib/logger'

type Params = { id: string }

/** List a team's goals. */
export const GET = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    return apiSuccess(await listGoals(context!.params!.id))
  } catch (error) {
    logger.error('Error listing team goals', { error })
    return apiError(error, 'Fehler beim Laden der Ziele')
  }
})

/** Add a goal. */
export const POST = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const body = await request.json()
    const result = createGoalSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    return apiSuccess(await createGoal(context!.params!.id, result.data), 201)
  } catch (error) {
    logger.error('Error creating team goal', { error })
    return apiError(error, 'Fehler beim Erstellen des Ziels')
  }
})
