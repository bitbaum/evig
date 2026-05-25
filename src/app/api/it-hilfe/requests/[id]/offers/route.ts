import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests, users, repairerProfiles } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { validateBody, CreateOfferSchema } from '@/lib/schemas'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeNewOfferReceived } from '@/lib/email/templates/it-hilfe'
import { sendItHilfeNotification } from '@/lib/it-hilfe/notifications'
import { rateLimiters } from '@/lib/security/rate-limit'
import { APP_URL } from '@/config/urls'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/it-hilfe/requests/[id]/offers
 * Get offers for a request (owner only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST_ID)
    }

    // Check if request exists and user is owner
    const [requestData] = await db
      .select({ requesterId: itHilfeRequests.requesterId, status: itHilfeRequests.status })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!requestData) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    if (requestData.requesterId !== session.user.id) {
      return apiForbidden('Du kannst nur Angebote für deine eigenen Anfragen einsehen')
    }

    // Get offers with helper details + repairer profile info
    const rows = await db
      .select({
        id: itHilfeOffers.id,
        requestId: itHilfeOffers.requestId,
        helperId: itHilfeOffers.helperId,
        helperName: users.name,
        helperEmail: users.email,
        message: itHilfeOffers.message,
        estimatedTime: itHilfeOffers.estimatedTime,
        proposedCompensation: itHilfeOffers.proposedCompensation,
        relevantSkills: itHilfeOffers.relevantSkills,
        status: itHilfeOffers.status,
        createdAt: itHilfeOffers.createdAt,
        repairerProfileId: itHilfeOffers.repairerProfileId,
        repairerBusinessName: repairerProfiles.businessName,
        repairerIsVerified: repairerProfiles.isVerified,
        repairerAverageRating: repairerProfiles.averageRating,
        repairerTotalReviews: repairerProfiles.totalReviews,
      })
      .from(itHilfeOffers)
      .innerJoin(users, eq(itHilfeOffers.helperId, users.id))
      .leftJoin(repairerProfiles, eq(itHilfeOffers.repairerProfileId, repairerProfiles.id))
      .where(eq(itHilfeOffers.requestId, id))
      .orderBy(desc(itHilfeOffers.createdAt))

    const offers = rows.map(row => ({
      id: row.id,
      requestId: row.requestId,
      helperId: row.helperId,
      helperName: row.helperName,
      helperEmail: row.helperEmail,
      message: row.message,
      estimatedTime: row.estimatedTime,
      proposedCompensation: row.proposedCompensation,
      relevantSkills: row.relevantSkills || [],
      status: row.status,
      createdAt: row.createdAt,
      repairerProfile: row.repairerProfileId ? {
        id: row.repairerProfileId,
        businessName: row.repairerBusinessName,
        isVerified: row.repairerIsVerified,
        averageRating: row.repairerAverageRating,
        totalReviews: row.repairerTotalReviews,
      } : null,
    }))

    logger.info('Fetched offers for request', {
      requestId: id,
      ownerId: session.user.id,
      offerCount: offers.length,
    })

    return apiSuccess({ offers })
  } catch (error) {
    logger.error('Error fetching offers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/it-hilfe/requests/[id]/offers
 * Submit an offer for a request (requires auth, not own request)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    if (!rateLimiters.offerCreate(session.user.id + ':offer')) {
      return apiError(new Error('Rate limit'), 'Zu viele Angebote. Bitte versuche es später erneut.', 429)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST_ID)
    }

    // Check if request exists and is open
    const [requestData] = await db
      .select({
        requesterId: itHilfeRequests.requesterId,
        status: itHilfeRequests.status,
        title: itHilfeRequests.title,
        requester_name: users.name,
        requester_email: users.email,
      })
      .from(itHilfeRequests)
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .where(eq(itHilfeRequests.id, id))

    if (!requestData) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    // Cannot offer on own request
    if (requestData.requesterId === session.user.id) {
      return apiBadRequest('Du kannst kein Angebot für deine eigene Anfrage abgeben')
    }

    // Only allow offers on open requests
    if (requestData.status !== REQUEST_STATUS.OPEN) {
      return apiBadRequest('Diese Anfrage akzeptiert keine neuen Angebote mehr')
    }

    // Check if request has expired
    const [expired] = await db
      .select({ id: itHilfeRequests.id })
      .from(itHilfeRequests)
      .where(and(
        eq(itHilfeRequests.id, id),
        sql`${itHilfeRequests.expiresAt} <= NOW()`
      ))
    if (expired) {
      return apiBadRequest('Diese Anfrage ist abgelaufen')
    }

    // Check if user already made an offer
    const [existingOffer] = await db
      .select({ id: itHilfeOffers.id })
      .from(itHilfeOffers)
      .where(and(
        eq(itHilfeOffers.requestId, id),
        eq(itHilfeOffers.helperId, session.user.id)
      ))

    if (existingOffer) {
      return apiBadRequest('Du hast bereits ein Angebot für diese Anfrage abgegeben')
    }

    const body = await request.json()
    const validation = validateBody(CreateOfferSchema, body)
    if (!validation.success) return validation.error
    const { message, estimatedTime, proposedCompensation, relevantSkills } = validation.data

    // Check if the user has an active repairer profile — auto-link if so
    const [repairerProfile] = await db
      .select({ id: repairerProfiles.id })
      .from(repairerProfiles)
      .where(and(
        eq(repairerProfiles.userId, session.user.id),
        eq(repairerProfiles.isActive, true)
      ))

    // Insert the offer
    const [newOffer] = await db
      .insert(itHilfeOffers)
      .values({
        requestId: id,
        helperId: session.user.id,
        message,
        estimatedTime: estimatedTime || undefined,
        proposedCompensation: proposedCompensation || undefined,
        relevantSkills: relevantSkills.length > 0 ? relevantSkills : undefined,
        repairerProfileId: repairerProfile?.id || undefined,
      })
      .returning({ id: itHilfeOffers.id })

    // Increment offer count. Request status stays OPEN until an offer is
    // accepted (→ MATCHED). The legacy `IN_DISCUSSION` auto-transition was
    // removed — it was a dead state never surfaced in UI. Legacy rows with
    // status='in_discussion' remain accepted by the filter at line 158
    // until a follow-up DB migration normalises them to 'open'.
    await db
      .update(itHilfeRequests)
      .set({ offerCount: sql`${itHilfeRequests.offerCount} + 1` })
      .where(eq(itHilfeRequests.id, id))

    logger.info('Created IT-Hilfe offer', {
      offerId: newOffer.id,
      requestId: id,
      helperId: session.user.id,
    })

    // In-app notification for requester
    sendItHilfeNotification({
      recipientIds: [requestData.requesterId],
      title: `Neues Angebot für "${requestData.title}"`,
      content: `${session.user.name || 'Ein Techniker'} hat ein Angebot für deine Anfrage abgegeben.`,
      requestId: id,
    })

    // Notify requester about new offer (fire-and-forget)
    if (requestData.requester_email) {
      const requestUrl = `${APP_URL}/it-hilfe/${id}`
      sendCustomEmail(
        requestData.requester_email,
        itHilfeNewOfferReceived(
          requestData.requester_name || 'Nutzer',
          requestData.title,
          session.user.name || 'Ein Techniker',
          message,
          requestUrl
        )
      ).catch(err => logger.error('Failed to send new offer notification', { err, requestId: id }))
    }

    return apiSuccess({
      message: 'Angebot erfolgreich abgegeben',
      offerId: newOffer.id,
    }, 201)
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique_offer_per_user_request')) {
      return apiBadRequest('Du hast bereits ein Angebot für diese Anfrage abgegeben')
    }
    logger.error('Error creating offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
