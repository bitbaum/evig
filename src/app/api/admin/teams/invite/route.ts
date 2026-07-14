import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { z } from 'zod'
import { createClaimToken } from '@/lib/services/team-invites'
import { logger } from '@/lib/logger'

const inviteSchema = z.object({ user_id: z.string().uuid('Ungültige Benutzer-ID') })

/**
 * Mint a claim link for a placeholder member. Structural onboarding → super
 * admins only (matches team create/delete). Returns the token; the client
 * builds the absolute /einladung/<token> URL from its own origin.
 */
export const POST = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {
  try {
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur Super-Admins können einladen')
    }
    const result = inviteSchema.safeParse(await request.json())
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const token = await createClaimToken(result.data.user_id)
    if (!token) return apiNotFound('Platzhalter-Konto (oder bereits übernommen)')
    return apiSuccess({ token })
  } catch (error) {
    logger.error('Error creating claim invite', { error })
    return apiError(error, 'Einladung konnte nicht erstellt werden')
  }
})
