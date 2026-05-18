import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { sendReferralInvitation } from '@/lib/referral'

const InviteSchema = z.object({
  email: z.string().email(),
})

export const POST = withAuth(async (request: NextRequest, session) => {
  const body = await request.json().catch(() => null)
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid email address', 400)

  const { email } = parsed.data
  const inviterName = session.user.name ?? session.user.email ?? 'Jemand'

  const result = await sendReferralInvitation(
    session.user.id,
    inviterName,
    session.user.email,
    email,
  )

  if (!result.success) {
    const messages: Record<string, string> = {
      cannot_self_invite: 'Du kannst dich nicht selbst einladen.',
      already_invited: 'Diese E-Mail-Adresse wurde bereits eingeladen.',
      email_failed: 'Einladung konnte nicht gesendet werden. Bitte versuche es später erneut.',
    }
    return apiError(messages[result.error ?? ''] ?? 'Fehler beim Senden der Einladung.', 400)
  }

  return apiSuccess({ message: 'Einladung gesendet.' })
})
