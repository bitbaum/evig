import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { updateTeamSchema } from '@/lib/schemas/teams'
import { getTeam, getTeamMembers, updateTeam, deactivateTeam } from '@/lib/services/teams'
import { logger } from '@/lib/logger'

type Params = { id: string }

export const GET = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const id = context!.params!.id
    const team = await getTeam(id)
    if (!team) return apiNotFound('Team')
    const members = await getTeamMembers(id)
    return apiSuccess({ team, members })
  } catch (error) {
    logger.error('Error loading team', { error })
    return apiError(error, 'Fehler beim Laden des Teams')
  }
})

export const PUT = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const id = context!.params!.id
    const body = await request.json()
    const result = updateTeamSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const team = await updateTeam(id, result.data)
    if (!team) return apiNotFound('Team')
    return apiSuccess(team)
  } catch (error) {
    logger.error('Error updating team', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Teams')
  }
})

export const DELETE = withAdmin<Params>('teams', async (
  _request: NextRequest,
  session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur Super-Admins können Teams entfernen')
    }
    const ok = await deactivateTeam(context!.params!.id)
    if (!ok) return apiNotFound('Team')
    return apiSuccess({ deactivated: true })
  } catch (error) {
    logger.error('Error deactivating team', { error })
    return apiError(error, 'Fehler beim Entfernen des Teams')
  }
})
