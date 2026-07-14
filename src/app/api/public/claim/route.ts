import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { claimAccountSchema } from '@/lib/schemas/teams'
import { consumeClaim } from '@/lib/services/team-invites'
import { validatePasswordStrength } from '@/lib/auth/password'
import { logger } from '@/lib/logger'

/**
 * Public: a real person claims a placeholder account via their invite token.
 * No auth — the single-use token IS the authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const result = claimAccountSchema.safeParse(await request.json())
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }
    const { token, name, email, password } = result.data

    // Password strength: auth SSOT, same bar as registration / reset.
    const strength = validatePasswordStrength(password)
    if (!strength.isValid) {
      return apiBadRequest(strength.errors[0] ?? 'Passwort zu schwach')
    }

    const claim = await consumeClaim(token, { name, email, password })
    if (!claim.success) return apiBadRequest(claim.error ?? 'Übernahme fehlgeschlagen')
    return apiSuccess({ claimed: true })
  } catch (error) {
    logger.error('Error consuming account claim', { error })
    return apiError(error, 'Übernahme fehlgeschlagen')
  }
}
