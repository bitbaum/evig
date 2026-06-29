import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests, users, repairerProfiles } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, OFFER_STATUS } from '@/config/it-hilfe'
import { validateBody, CreateOfferSchema } from '@/lib/schemas'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { signOfferAcceptToken } from '@/lib/it-hilfe/offer-accept-tokens'
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

    // Check if user already made an offer. The UNIQUE(request_id, helper_id)
    // schema constraint means a withdrawn-then-resubmit helper would hit
    // a duplicate-key violation on a fresh INSERT — and the prior version
    // of this check rejected with "Du hast bereits ein Angebot abgegeben"
    // even after the helper had withdrawn. Resurrect a withdrawn row by
    // UPDATEing it back to PENDING below. Same shape as the workshop
    // re-registration fix (501ff9fa) and the repairer re-application
    // fix (d128beff).
    const [existingOffer] = await db
      .select({ id: itHilfeOffers.id, status: itHilfeOffers.status })
      .from(itHilfeOffers)
      .where(and(
        eq(itHilfeOffers.requestId, id),
        eq(itHilfeOffers.helperId, session.user.id)
      ))

    if (existingOffer && existingOffer.status !== OFFER_STATUS.WITHDRAWN) {
      return apiBadRequest('Du hast bereits ein Angebot für diese Anfrage abgegeben')
    }

    const withdrawnOfferId = existingOffer?.status === OFFER_STATUS.WITHDRAWN ? existingOffer.id : null

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

    // Insert OR resurrect a withdrawn offer. UNIQUE(request_id, helper_id)
    // prevents a fresh INSERT when a withdrawn row exists, so reuse it:
    // overwrite the message/details, flip status back to PENDING, keep the
    // same id so any external references remain valid. offerCount is
    // incremented either way (the withdraw route decremented it).
    // The application is the single source of truth for offer_count — the DB
    // trigger that ALSO incremented it (double-counting fresh offers) was dropped
    // in migration 100. Offer write + count bump run in one transaction so they
    // stay atomic. Request status stays OPEN until an offer is accepted (→ MATCHED).
    const newOffer = await db.transaction(async (tx) => {
      let offer: { id: string }
      if (withdrawnOfferId) {
        const [updated] = await tx
          .update(itHilfeOffers)
          .set({
            message,
            estimatedTime: estimatedTime || undefined,
            proposedCompensation: proposedCompensation || undefined,
            relevantSkills: relevantSkills.length > 0 ? relevantSkills : undefined,
            repairerProfileId: repairerProfile?.id || undefined,
            status: OFFER_STATUS.PENDING,
          })
          .where(eq(itHilfeOffers.id, withdrawnOfferId))
          .returning({ id: itHilfeOffers.id })
        offer = updated
      } else {
        const [inserted] = await tx
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
        offer = inserted
      }

      await tx
        .update(itHilfeRequests)
        .set({ offerCount: sql`${itHilfeRequests.offerCount} + 1` })
        .where(eq(itHilfeRequests.id, id))

      return offer
    })

    logger.info('Created IT-Hilfe offer', {
      offerId: newOffer.id,
      requestId: id,
      helperId: session.user.id,
    })

    // Notify requester — in-app + rich email in a single central call. The
    // signed acceptToken powers the one-tap accept flow at
    // /it-hilfe/accept?token=... — HMAC failure only happens if AUTH_SECRET
    // isn't configured (dev). Fall through to view-only email then.
    const requestUrl = `${APP_URL}/it-hilfe/${id}`
    let acceptUrl: string | undefined
    try {
      const acceptToken = signOfferAcceptToken(newOffer.id)
      acceptUrl = `${APP_URL}/it-hilfe/accept?token=${encodeURIComponent(acceptToken)}`
    } catch (err) {
      logger.warn('Could not sign offer-accept token; email will fall back to view-only link', {
        err,
        offerId: newOffer.id,
      })
    }

    notifyUsers([requestData.requesterId], {
      type: NOTIFICATION_TYPES.IT_HILFE_NEW_OFFER,
      title: `Neues Angebot für "${requestData.title}"`,
      content: `${session.user.name || 'Ein Techniker'} hat ein Angebot für deine Anfrage abgegeben.`,
      related_type: RELATED_TYPES.IT_HILFE,
      related_id: id,
      metadata: {
        requesterName: requestData.requester_name || 'Nutzer',
        requestTitle: requestData.title,
        helperName: session.user.name || 'Ein Techniker',
        offerMessage: message,
        requestUrl,
        ...(acceptUrl ? { acceptUrl } : {}),
      },
    }).catch(err => logger.warn('Failed to notify on new offer', { error: err, requestId: id }))

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
