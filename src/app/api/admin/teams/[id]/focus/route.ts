import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { updateTeamFocusSchema } from '@/lib/schemas/teams'
import { updateTeamFocus } from '@/lib/services/teams'
import { logger } from '@/lib/logger'

type Params = { id: string }

export const PATCH = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const body = await request.json()
    const result = updateTeamFocusSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const team = await updateTeamFocus(context!.params!.id, result.data.current_focus)
    if (!team) return apiNotFound('Team')
    return apiSuccess(team)
  } catch (error) {
    logger.error('Error updating team focus', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Team-Fokus')
  }
})
