import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshopProposals, locations, users } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { validateBody, WorkshopProposalSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

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

    // Check if user already has pending proposals (limit to prevent spam)
    const [proposalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workshopProposals)
      .where(and(
        eq(workshopProposals.userId, session.user.id),
        sql`${workshopProposals.status} IN (${APPROVAL_STATUS.PENDING}, ${APPROVAL_STATUS.APPROVED})`,
        gte(workshopProposals.createdAt, sql`NOW() - INTERVAL '30 days'`),
      ))

    if (Number(proposalCount?.count ?? 0) >= 3) {
      return apiBadRequest('Sie haben bereits 3 ausstehende oder genehmigte Workshop-Vorschläge. Bitte warten Sie auf deren Bearbeitung.')
    }

    // Calculate duration in minutes and price in cents
    const durationMinutes = Math.round(durationHours * 60)
    const priceCents = Math.round(pricePerPerson * 100)

    // Validate selected location if provided
    if (selectedLocationId) {
      const [location] = await db
        .select({ id: locations.id, isApproved: locations.isApproved })
        .from(locations)
        .where(eq(locations.id, selectedLocationId))

      if (!location) {
        return apiBadRequest('Ausgewählter Ort existiert nicht')
      }
      if (!location.isApproved) {
        return apiBadRequest('Ausgewählter Ort ist nicht zur Buchung freigegeben')
      }
    }

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

    // Send confirmation email to proposer
    try {
      await sendEmail(
        session.user.email || '',
        'workshopProposalSubmitted',
        session.user.name || 'Workshop-Interessent',
        title,
        proposal.id
      )
    } catch (emailError) {
      logger.warn('Failed to send workshop proposal confirmation email', {
        proposalId: proposal.id,
        error: emailError
      })
    }

    // Send notification email to admins (staff users)
    try {
      const adminEmails = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.isStaff, true))

      const adminDashboardUrl = `${APP_URL}/admin/workshop-proposals`

      for (const admin of adminEmails) {
        await sendEmail(
          admin.email,
          'adminNewWorkshopProposal',
          session.user.name || 'Unbekannt',
          session.user.email || 'unbekannt@example.com',
          title,
          adminDashboardUrl
        )
      }
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
}
