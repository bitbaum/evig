import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from '@/lib/api/helpers'
import { createTeamSchema } from '@/lib/schemas/teams'
import { listTeams, createTeam } from '@/lib/services/teams'
import { logger } from '@/lib/logger'

export const GET = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {
  try {
    const includeInactive = new URL(request.url).searchParams.get('includeInactive') === 'true'
    const rows = await listTeams(includeInactive)
    return apiSuccess(rows)
  } catch (error) {
    logger.error('Error listing teams', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Teams')
  }
})

export const POST = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {
  try {
    // Creating/removing a team is structural — reserve it for super admins.
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur Super-Admins können Teams anlegen')
    }
    const body = await request.json()
    const result = createTeamSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const row = await createTeam(result.data)
    return apiSuccess(row, 201)
  } catch (error) {
    logger.error('Error creating team', { error, email: session.user.email })
    return apiError(error, 'Fehler beim Erstellen des Teams')
  }
})
