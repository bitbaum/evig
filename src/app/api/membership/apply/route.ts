import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { z } from 'zod'
import { db } from '@/db'
import { users, membershipApplications } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendCustomEmail } from '@/lib/email'
import { BANK, MEMBERSHIP, ORG } from '@/config/org'
import { MEMBERSHIP_APPLICATION_STATUS } from '@/config/membership-status'
import { escapeHtml } from '@/lib/utils/escape-html'

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
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimit.retryAfter,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
    }

    const body = await request.json()
    const result = MembershipSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST, result.error.flatten().fieldErrors)
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    // Membership check + activation must be atomic: without a transaction
    // two fast applies for the same logged-in user both read isMember=false
    // and both create an APPROVED application row.
    type ApplyResult =
      | { kind: 'blocked'; message: string }
      | { kind: 'ok'; applicationId: string }

    const txResult: ApplyResult = await db.transaction(async (tx) => {
      if (userId) {
        const [existing] = await tx
          .select({ isMember: users.isMember })
          .from(users)
          .where(eq(users.id, userId))
          .for('update')
          .limit(1)

        if (existing?.isMember) {
          return { kind: 'blocked', message: 'Du bist bereits Mitglied.' }
        }
      }

      const [application] = await tx
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

      if (userId) {
        await tx
          .update(users)
          .set({
            isMember: true,
            memberSince: new Date().toISOString(),
            memberType: result.data.memberType,
          })
          .where(eq(users.id, userId))
      } else {
        const [existingUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, result.data.applicantEmail))
          .for('update')
          .limit(1)

        if (existingUser) {
          await tx
            .update(users)
            .set({
              isMember: true,
              memberSince: new Date().toISOString(),
              memberType: result.data.memberType,
            })
            .where(eq(users.id, existingUser.id))

          await tx
            .update(membershipApplications)
            .set({ userId: existingUser.id })
            .where(eq(membershipApplications.id, application.id))
        }
      }

      return { kind: 'ok', applicationId: application.id }
    })

    if (txResult.kind === 'blocked') {
      return apiBadRequest(txResult.message)
    }
    const application = { id: txResult.applicationId }

    logger.info('Membership activated', {
      applicationId: application.id,
      userId,
      memberType: result.data.memberType,
    })

    // Send welcome email with payment instructions (fire-and-forget).
    // applicantName is user-supplied; escape before HTML interpolation.
    const fee = result.data.memberType === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
    const eName = escapeHtml(result.data.applicantName)
    sendCustomEmail(result.data.applicantEmail, {
      subject: `Willkommen im ${ORG.legalName}!`,
      html: `<p>Hallo ${eName},</p><p>du bist jetzt Mitglied von ${ORG.name}! Bitte überweise den Jahresbeitrag von CHF ${fee} an:</p><p><strong>IBAN:</strong> ${BANK.iban}<br><strong>Bank:</strong> ${BANK.name}<br><strong>Empfänger:</strong> ${BANK.accountHolder}</p><p>Vielen Dank!</p>`,
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
