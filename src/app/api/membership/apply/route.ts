import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { z } from 'zod'
import { db } from '@/db'
import { membershipApplications } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

const MembershipApplicationSchema = z.object({
  applicantName: z.string().min(2, 'Name erforderlich').max(200),
  applicantEmail: z.string().email('Ungültige E-Mail-Adresse'),
  addressStreet: z.string().min(2, 'Adresse erforderlich').max(200),
  addressPostalCode: z.string().regex(/^\d{4}$/, 'Ungültige PLZ'),
  addressCity: z.string().min(2, 'Ort erforderlich').max(100),
  birthDate: z.string().optional(),
  memberType: z.enum(['regular', 'reduced']).default('regular'),
  motivation: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting to prevent spam
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, 'newsletter')
    if (!rateLimit.allowed) {
      return apiRateLimited('Zu viele Anfragen. Bitte versuche es später erneut.', {
        retryAfter: rateLimit.retryAfter,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
    }

    const body = await request.json()
    const result = MembershipApplicationSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Ungültige Anfrage', result.error.flatten().fieldErrors)
    }

    // If logged in, link the application to the user account
    const session = await auth()
    const userId = session?.user?.id ?? null

    // Prevent duplicate pending applications from same user
    if (userId) {
      const existing = await db
        .select({ id: membershipApplications.id })
        .from(membershipApplications)
        .where(
          and(
            eq(membershipApplications.userId, userId),
            eq(membershipApplications.status, 'pending')
          )
        )
        .limit(1)

      if (existing.length > 0) {
        return apiBadRequest('Du hast bereits einen offenen Antrag. Wir melden uns in Kürze.')
      }
    }

    const [application] = await db
      .insert(membershipApplications)
      .values({
        userId,
        applicantName: result.data.applicantName,
        applicantEmail: result.data.applicantEmail,
        addressStreet: result.data.addressStreet,
        addressPostalCode: result.data.addressPostalCode,
        addressCity: result.data.addressCity,
        birthDate: result.data.birthDate || null,
        memberType: result.data.memberType,
        motivation: result.data.motivation || null,
        status: 'pending',
      })
      .returning({ id: membershipApplications.id })

    logger.info('Membership application submitted', {
      applicationId: application.id,
      userId,
      memberType: result.data.memberType,
    })

    return apiSuccess({
      id: application.id,
      message: 'Dein Antrag wurde erfolgreich eingereicht.',
    })
  } catch (error) {
    return apiError(error, 'Fehler beim Einreichen des Antrags')
  }
}
