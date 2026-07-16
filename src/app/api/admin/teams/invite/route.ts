import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { claimInviteSchema } from '@/lib/schemas/teams'
import { createClaimToken, emailClaimInvite } from '@/lib/services/team-invites'
import { logger } from '@/lib/logger'

/**
 * Mint a claim link for a placeholder member. Structural onboarding → super
 * admins only (matches team create/delete). With `email` set, the link is also
 * sent to that (real) address; either way the token is returned so the client
 * can build the absolute /einladung/<token> URL from its own origin.
 */
export const POST = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {
  try {
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur Super-Admins können einladen')
    }
    const result = claimInviteSchema.safeParse(await request.json())
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const { user_id, email } = result.data

    if (email) {
      const invite = await emailClaimInvite(user_id, email, session.user.name || 'RevampIT')
      if (!invite) return apiNotFound('Platzhalter-Konto (oder bereits übernommen)')
      return apiSuccess(invite)
    }

    const token = await createClaimToken(user_id)
    if (!token) return apiNotFound('Platzhalter-Konto (oder bereits übernommen)')
    return apiSuccess({ token, emailed: false })
  } catch (error) {
    logger.error('Error creating claim invite', { error })
    return apiError(error, 'Einladung konnte nicht erstellt werden')
  }
})
