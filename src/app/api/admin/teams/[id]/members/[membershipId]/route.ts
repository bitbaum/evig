import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { changeRoleSchema } from '@/lib/schemas/teams'
import { changeMemberRole, removeMember } from '@/lib/services/teams'
import type { TeamRole } from '@/config/teams'
import { logger } from '@/lib/logger'

type Params = { id: string; membershipId: string }

/** Change a member's role (auto-demotes a prior lead/deputy in the team). */
export const PATCH = withAdmin<Params>('teams', async (
  request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, membershipId } = context!.params!
    const body = await request.json()
    const result = changeRoleSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const ok = await changeMemberRole(id, membershipId, result.data.role as TeamRole)
    if (!ok) return apiNotFound('Mitgliedschaft')
    return apiSuccess({ updated: true })
  } catch (error) {
    logger.error('Error changing member role', { error })
    return apiError(error, 'Fehler beim Ändern der Rolle')
  }
})

/** Remove a member (soft-leave — membership history is preserved). */
export const DELETE = withAdmin<Params>('teams', async (
  _request: NextRequest,
  _session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    const { id, membershipId } = context!.params!
    const ok = await removeMember(id, membershipId)
    if (!ok) return apiNotFound('Mitgliedschaft')
    return apiSuccess({ removed: true })
  } catch (error) {
    logger.error('Error removing team member', { error })
    return apiError(error, 'Fehler beim Entfernen des Mitglieds')
  }
})
