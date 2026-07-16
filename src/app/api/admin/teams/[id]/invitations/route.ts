import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from '@/lib/api/helpers'
import { inviteByEmailSchema } from '@/lib/schemas/teams'
import { inviteByEmail } from '@/lib/services/team-invites'
import type { TeamRole } from '@/config/teams'
import { logger } from '@/lib/logger'

type Params = { id: string }

/**
 * Invite a person into the team by name + email. Registered staff are added
 * directly (and notified); unknown addresses get a placeholder account with
 * the membership and a claim link by email. Structural onboarding → super
 * admins only (matches team create / claim-link minting).
 */
export const POST = withAdmin<Params>('teams', async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: Params },
) => {
  try {
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur Super-Admins können einladen')
    }
    const result = inviteByEmailSchema.safeParse(await request.json())
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const invite = await inviteByEmail({
      teamId: context!.params!.id,
      name: result.data.name,
      email: result.data.email,
      role: result.data.role as TeamRole,
      inviterName: session.user.name || 'RevampIT',
    })
    if (invite.outcome === 'error') return apiBadRequest(invite.error)
    return apiSuccess(invite, 201)
  } catch (error) {
    logger.error('Error inviting team member by email', { error })
    return apiError(error, 'Einladung konnte nicht erstellt werden')
  }
})
