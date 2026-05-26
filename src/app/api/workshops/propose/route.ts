import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopProposals, locations, users } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { validateBody, WorkshopProposalSchema } from '@/lib/schemas'

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const validation = validateBody(WorkshopProposalSchema, body)
    if (!validation.success) return validation.error
    const {
      title,
      description,
      shortDescription,
      category,
      durationHours,
      level,
      maxParticipants,
      minParticipants,
      pricePerPerson,
      prerequisites,
      learningObjectives,
      targetAudience,
      materialsProvided,
      materialsRequired,
      locationType,
      selectedLocationId,
      proposedLocation,
      proposedDate,
      proposedTime,
      specialRequirements,
      termsAccepted
    } = validation.data

    // Spam check + location validation are independent — run in parallel
    const [proposalCount, location] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(workshopProposals)
        .where(and(
          eq(workshopProposals.userId, session.user.id),
          sql`${workshopProposals.status} IN (${APPROVAL_STATUS.PENDING}, ${APPROVAL_STATUS.APPROVED})`,
          gte(workshopProposals.createdAt, sql`NOW() - INTERVAL '30 days'`),
        ))
        .then(rows => rows[0]),
      selectedLocationId
        ? db
            .select({ id: locations.id, isApproved: locations.isApproved })
            .from(locations)
            .where(eq(locations.id, selectedLocationId))
            .then(rows => rows[0])
        : Promise.resolve(undefined),
    ])

    if (Number(proposalCount?.count ?? 0) >= 3) {
      return apiBadRequest('Du hast bereits 3 ausstehende oder genehmigte Workshop-Vorschläge. Bitte warte auf deren Bearbeitung.')
    }

    if (selectedLocationId) {
      if (!location) {
        return apiBadRequest('Ausgewählter Ort existiert nicht')
      }
      if (!location.isApproved) {
        return apiBadRequest('Ausgewählter Ort ist nicht zur Buchung freigegeben')
      }
    }

    // Calculate duration in minutes and price in cents
    const durationMinutes = Math.round(durationHours * 60)
    const priceCents = Math.round(pricePerPerson * 100)

    // Create workshop proposal
    const [proposal] = await db
      .insert(workshopProposals)
      .values({
        userId: session.user.id,
        title,
        description,
        shortDescription: shortDescription || undefined,
        category: category || undefined,
        durationMinutes,
        level,
        maxParticipants,
        minParticipants,
        priceCents,
        prerequisites: prerequisites || undefined,
        learningObjectives: learningObjectives || [],
        targetAudience: targetAudience || undefined,
        materialsProvided: materialsProvided || undefined,
        materialsRequired: materialsRequired || undefined,
        locationType,
        selectedLocationId: selectedLocationId || undefined,
        proposedLocation: proposedLocation || undefined,
        proposedDate: proposedDate || undefined,
        proposedTime: proposedTime || undefined,
        specialRequirements: specialRequirements || undefined,
        termsAccepted,
        status: APPROVAL_STATUS.PENDING,
      } as typeof workshopProposals.$inferInsert)
      .returning({ id: workshopProposals.id })

    // Send confirmation email to proposer.
    //
    // sendEmail() resolves { success: false } on SMTP / Listmonk failure
    // rather than throwing (src/lib/email/index.ts:178). The previous
    // try/catch only caught actual rejections, so a silent send-failure
    // logged nothing and the proposer never knew their confirmation
    // didn't arrive. Inspect the resolved result; outer try/catch keeps
    // the (rejected) path for unexpected throws. Same pattern as the
    // blog/submit fix (commit b88cbda5) and the 10 prior swallow fixes.
    try {
      const sendResult = await sendEmail(
        session.user.email || '',
        'workshopProposalSubmitted',
        session.user.name || 'Workshop-Interessent',
        title,
        proposal.id
      )
      if (sendResult.success) {
        logger.info('Workshop proposal confirmation email sent', {
          proposalId: proposal.id,
        })
      } else {
        logger.warn('Failed to send workshop proposal confirmation email (resolved)', {
          proposalId: proposal.id,
          error: sendResult.error,
        })
      }
    } catch (emailError) {
      logger.warn('Failed to send workshop proposal confirmation email (rejected)', {
        proposalId: proposal.id,
        error: emailError
      })
    }

    // Send notification email to admins (staff users).
    //
    // Previously the fan-out used `await Promise.allSettled(...)` with
    // no result inspection — every admin email failure (rejected OR
    // resolved { success: false }) was silently dropped. The proposal
    // sits in the DB and admins never see the notification ping, so it
    // is effectively invisible until someone manually checks
    // /admin/workshops/proposals. Inspect each settled result and log
    // per-admin failures with the (resolved)/(rejected) convention.
    try {
      const adminEmails = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.isStaff, true))

      // Admin dashboard for proposals lives at /admin/workshops/proposals;
      // the previous URL (/admin/workshop-proposals) is not a route and 404s.
      const adminDashboardUrl = `${APP_URL}/admin/workshops/proposals`

      // Fan out in parallel — sequential awaits would add ~200 ms × N
      // admins to the user's response time.
      const adminTargets = adminEmails.filter((a): a is { email: string } => Boolean(a.email))
      const results = await Promise.allSettled(
        adminTargets.map(admin =>
          sendEmail(
            admin.email,
            'adminNewWorkshopProposal',
            session.user.name || 'Unbekannt',
            session.user.email ?? 'nicht angegeben',
            title,
            adminDashboardUrl
          )
        )
      )
      results.forEach((settled, i) => {
        const adminEmail = adminTargets[i].email
        if (settled.status === 'fulfilled' && !settled.value.success) {
          logger.warn('Failed to send workshop proposal admin notification (resolved)', {
            proposalId: proposal.id,
            adminEmail,
            error: settled.value.error,
          })
        } else if (settled.status === 'rejected') {
          logger.warn('Failed to send workshop proposal admin notification (rejected)', {
            proposalId: proposal.id,
            adminEmail,
            error: settled.reason,
          })
        }
      })
    } catch (adminEmailError) {
      logger.warn('Failed to send workshop proposal admin notification', {
        proposalId: proposal.id,
        error: adminEmailError
      })
    }

    return apiSuccess({
      message: 'Workshop-Vorschlag erfolgreich eingereicht',
      proposalId: proposal.id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
