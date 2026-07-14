import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { addMembershipSchema } from '@/lib/schemas/teams'
import { getTeam, getTeamMembers, addMember, transferMembership } from '@/lib/services/teams'
import type { TeamRole } from '@/config/teams'
import { logger } from '@/lib/logger'

type Params = { id: string }

/** List a team's current members (live memberships). */
export const GET = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const members = await getTeamMembers(context!.params!.id)
    return apiSuccess(members)
  } catch (error) {
    logger.error('Error listing team members', { error })
    return apiError(error, 'Fehler beim Laden der Mitglieder')
  }
})

/**
 * Add a person to the team, or TRANSFER them in (when from_team_id is set —
 * their live membership in that team is closed first). Idempotent.
 */
export const POST = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const teamId = context!.params!.id
    const team = await getTeam(teamId)
    if (!team) return apiNotFound('Team')

    const body = await request.json()
    const result = addMembershipSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const { user_id, role, from_team_id } = result.data

    const outcome = from_team_id
      ? await transferMembership(user_id, { from_team_id, to_team_id: teamId, role: role as TeamRole })
      : await addMember(teamId, user_id, role as TeamRole)

    return apiSuccess(outcome, outcome.reused ? 200 : 201)
  } catch (error) {
    logger.error('Error adding team member', { error })
    return apiError(error, 'Fehler beim Hinzufügen des Mitglieds')
  }
})
