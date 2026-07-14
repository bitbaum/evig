import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { updateGoalSchema } from '@/lib/schemas/teams'
import { updateGoal, deleteGoal } from '@/lib/services/team-coordination'
import { logger } from '@/lib/logger'

type Params = { id: string; goalId: string }

/** Edit a goal (title / detail / status / horizon). */
export const PATCH = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, goalId } = context!.params!
    const body = await request.json()
    const result = updateGoalSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const ok = await updateGoal(id, goalId, result.data)
    if (!ok) return apiNotFound('Ziel')
    return apiSuccess({ updated: true })
  } catch (error) {
    logger.error('Error updating team goal', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Ziels')
  }
})

/** Delete a goal. */
export const DELETE = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, goalId } = context!.params!
    const ok = await deleteGoal(id, goalId)
    if (!ok) return apiNotFound('Ziel')
    return apiSuccess({ removed: true })
  } catch (error) {
    logger.error('Error deleting team goal', { error })
    return apiError(error, 'Fehler beim Löschen des Ziels')
  }
})
