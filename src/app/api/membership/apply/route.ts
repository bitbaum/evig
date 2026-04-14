import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { z } from 'zod'
import { db } from '@/db'
import { users, membershipApplications } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendCustomEmail } from '@/lib/email'
import { BANK, MEMBERSHIP, ORG } from '@/config/org'
import { MEMBERSHIP_APPLICATION_STATUS } from '@/config/membership-status'

const MembershipSchema = z.object({
  applicantName: z.string().min(2, 'Name erforderlich').max(200),
  applicantEmail: z.string().email('Ungültige E-Mail-Adresse'),
  addressStreet: z.string().min(2, 'Adresse erforderlich').max(200),
  addressPostalCode: z.string().regex(/^\d{4}$/, 'Ungültige PLZ'),
  addressCity: z.string().min(2, 'Ort erforderlich').max(100),
  memberType: z.enum(['regular', 'reduced']).default('regular'),
})

export async function POST(request: NextRequest) {
  try {
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
    const result = MembershipSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Ungültige Anfrage', result.error.flatten().fieldErrors)
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    // Check if already a member
    if (userId) {
      const [existing] = await db
        .select({ isMember: users.isMember })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (existing?.isMember) {
        return apiBadRequest('Du bist bereits Mitglied.')
      }
    }

    // Record the application (for audit trail)
    const [application] = await db
      .insert(membershipApplications)
      .values({
        userId,
        applicantName: result.data.applicantName,
        applicantEmail: result.data.applicantEmail,
        addressStreet: result.data.addressStreet,
        addressPostalCode: result.data.addressPostalCode,
        addressCity: result.data.addressCity,
        memberType: result.data.memberType,
        status: MEMBERSHIP_APPLICATION_STATUS.APPROVED,
        reviewedAt: new Date().toISOString(),
      })
      .returning({ id: membershipApplications.id })

    // Instantly activate membership if logged in
    if (userId) {
      await db
        .update(users)
        .set({
          isMember: true,
          memberSince: new Date().toISOString(),
          memberType: result.data.memberType,
        })
        .where(eq(users.id, userId))
    } else {
      // Try to find user by email and activate
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, result.data.applicantEmail))
        .limit(1)

      if (existingUser) {
        await db
          .update(users)
          .set({
            isMember: true,
            memberSince: new Date().toISOString(),
            memberType: result.data.memberType,
          })
          .where(eq(users.id, existingUser.id))

        // Link application to user
        await db
          .update(membershipApplications)
          .set({ userId: existingUser.id })
          .where(eq(membershipApplications.id, application.id))
      }
    }

    logger.info('Membership activated', {
      applicationId: application.id,
      userId,
      memberType: result.data.memberType,
    })

    // Send welcome email with payment instructions (fire-and-forget)
    const fee = result.data.memberType === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
    sendCustomEmail(result.data.applicantEmail, {
      subject: `Willkommen im ${ORG.legalName}!`,
      html: `<p>Hallo ${result.data.applicantName},</p><p>du bist jetzt Mitglied von ${ORG.name}! Bitte überweise den Jahresbeitrag von CHF ${fee} an:</p><p><strong>IBAN:</strong> ${BANK.iban}<br><strong>Bank:</strong> ${BANK.name}<br><strong>Empfänger:</strong> ${BANK.accountHolder}</p><p>Vielen Dank!</p>`,
      text: `Hallo ${result.data.applicantName}, du bist jetzt Mitglied von ${ORG.name}! Jahresbeitrag CHF ${fee} an IBAN ${BANK.iban} (${BANK.name}, ${BANK.accountHolder}).`,
    }).catch(err => logger.error('Failed to send membership welcome email', { err, applicationId: application.id }))

    return apiSuccess({
      id: application.id,
      memberType: result.data.memberType,
    })
  } catch (error) {
    return apiError(error, 'Fehler beim Beitreten')
  }
}
