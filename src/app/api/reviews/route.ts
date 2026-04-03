import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses, reviewVotes, reviewAttachments } from '@/db/schema/reviews'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { listings } from '@/db/schema/marketplace'
import { eq, and, sql, asc, desc, type SQL } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'
import { validateBody, validateQuery, CreateReviewSchema, GetReviewsQuerySchema } from '@/lib/schemas'
import {
  validateReviewTarget,
  updateHelperAverageRating,
  notifyRepairerOfReview,
} from '@/lib/reviews/review-service'
import { rateLimiters } from '@/lib/security/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryValidation = validateQuery(GetReviewsQuerySchema, {
      targetType: searchParams.get('targetType'),
      targetId: searchParams.get('targetId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })
    if (!queryValidation.success) return queryValidation.error
    const { targetType, targetId, status, limit, offset, sortBy, sortOrder } = queryValidation.data

    // Fetch session (optional — needed for voter_id and admin checks)
    const session = await auth()
    const voterId = session?.user?.id ?? null

    // Non-published reviews require admin
    if (status !== REVIEW_STATUS.PUBLISHED) {
      if (!session?.user?.id) return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
      if (!session.user.isStaff) return apiForbidden('Nur Administratoren haben Zugriff')
    }

    // Build sort clause
    const validSortFields = ['created_at', 'overall_rating', 'helpful_votes'] as const
    const sortField = validSortFields.includes(sortBy as typeof validSortFields[number]) ? sortBy : 'created_at'

    const sortColumnMap: Record<string, typeof reviews.createdAt | typeof reviews.overallRating | typeof reviews.helpfulVotes> = {
      created_at: reviews.createdAt,
      overall_rating: reviews.overallRating,
      helpful_votes: reviews.helpfulVotes,
    }
    const sortColumn = sortColumnMap[sortField] ?? reviews.createdAt
    const orderByClause = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    // Aliased users table for responder name
    const responder = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .as('responder')

    // Subquery for published response
    const publishedResponses = db
      .select({
        reviewId: reviewResponses.reviewId,
        id: reviewResponses.id,
        content: reviewResponses.content,
        createdAt: reviewResponses.createdAt,
        responderId: reviewResponses.responderId,
      })
      .from(reviewResponses)
      .where(eq(reviewResponses.status, REVIEW_STATUS.PUBLISHED))
      .as('rr')

    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        reviewerName: users.name,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        targetName: sql<string>`COALESCE(${repairerProfiles.businessName}, ${listings.title}, '')`,
        bookingId: reviews.bookingId,
        overallRating: reviews.overallRating,
        communicationRating: reviews.communicationRating,
        professionalismRating: reviews.professionalismRating,
        qualityRating: reviews.qualityRating,
        timelinessRating: reviews.timelinessRating,
        valueRating: reviews.valueRating,
        title: reviews.title,
        content: reviews.content,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        status: reviews.status,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        // Vote info
        userHasVoted: sql<boolean>`CASE WHEN ${reviewVotes.voteType} IS NOT NULL THEN true ELSE false END`,
        userVote: reviewVotes.voteType,
        // Response info
        responseId: publishedResponses.id,
        responseContent: publishedResponses.content,
        responseCreatedAt: publishedResponses.createdAt,
        responderName: responder.name,
        // Attachments subquery
        attachments: sql<{ id: string; original_filename: string; file_path: string; mime_type: string; attachment_type: string }[]>`(
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', ra.id,
              'original_filename', ra.original_filename,
              'file_path', ra.file_path,
              'mime_type', ra.mime_type,
              'attachment_type', ra.attachment_type
            ) ORDER BY ra.sort_order, ra.created_at
          ), '[]'::json)
          FROM ${reviewAttachments} ra
          WHERE ra.review_id = ${reviews.id}
        )`,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .leftJoin(
        listings,
        and(
          sql`${reviews.targetType} = 'listing'`,
          sql`${reviews.targetId}::text = ${listings.id}::text`
        )
      )
      .leftJoin(publishedResponses, eq(reviews.id, publishedResponses.reviewId))
      .leftJoin(responder, eq(publishedResponses.responderId, responder.id))
      .leftJoin(
        reviewVotes,
        and(
          eq(reviews.id, reviewVotes.reviewId),
          voterId ? eq(reviewVotes.voterId, voterId) : sql`false`
        )
      )
      .where(
        and(
          eq(reviews.targetType, targetType),
          eq(reviews.targetId, targetId),
          eq(reviews.status, status)
        )
      )
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    const total = rows[0]?._total ?? 0

    const isAdmin = !!session?.user?.isStaff

    const reviewList = rows.map(row => ({
      id: row.id,
      reviewerId: row.reviewerId,
      reviewerName: row.reviewerName,
      targetType: row.targetType,
      targetId: row.targetId,
      targetName: row.targetName,
      bookingId: row.bookingId,
      overallRating: row.overallRating,
      ratings: {
        communication: row.communicationRating,
        professionalism: row.professionalismRating,
        quality: row.qualityRating,
        timeliness: row.timelinessRating,
        value: row.valueRating,
      },
      title: row.title,
      content: row.content,
      isVerifiedPurchase: row.isVerifiedPurchase,
      helpfulVotes: row.helpfulVotes,
      totalVotes: row.totalVotes,
      userHasVoted: row.userHasVoted,
      userVote: row.userVote,
      status: row.status,
      attachments: ((row.attachments || []) as { id: string; original_filename: string; file_path: string; mime_type: string; attachment_type: string }[]).map(att => ({
        id: att.id,
        filename: att.original_filename,
        filePath: att.file_path,
        mimeType: att.mime_type,
        attachmentType: att.attachment_type,
      })),
      response: row.responseId ? {
        id: row.responseId,
        content: row.responseContent,
        createdAt: row.responseCreatedAt,
        responderName: row.responderName,
      } : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))

    logger.info('Fetched reviews', { targetType, targetId, status, count: reviewList.length })

    return apiSuccess({
      reviews: reviewList,
      total,
      pagination: { limit, offset, hasMore: offset + limit < total },
      filters: { targetType, targetId, status, sortBy: sortField, sortOrder: sortOrder === 'asc' ? 'ASC' : 'DESC' },
    })
  } catch (error) {
    logger.error('Error fetching reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    if (!rateLimiters.reviewCreate(session.user.id + ':review')) {
      return apiError(new Error('Rate limit'), 'Zu viele Bewertungen. Bitte versuchen Sie es später erneut.', 429)
    }

    const body = await request.json()
    const validation = validateBody(CreateReviewSchema, body)
    if (!validation.success) return validation.error

    const {
      targetType, targetId, bookingId, overallRating,
      communicationRating, professionalismRating, qualityRating,
      timelinessRating, valueRating, title, content,
    } = validation.data

    // Duplicate check
    const existingReview = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, session.user.id),
          eq(reviews.targetType, targetType),
          eq(reviews.targetId, targetId),
          bookingId
            ? eq(reviews.bookingId, bookingId)
            : sql`(${reviews.bookingId} IS NULL)`
        )
      )

    if (existingReview.length > 0) {
      return apiBadRequest('Sie haben bereits eine Bewertung für dieses Ziel abgegeben')
    }

    // Verify target exists
    if (!await validateReviewTarget(targetType, targetId)) {
      return apiNotFound('Das Bewertungsziel wurde nicht gefunden')
    }

    const verifiedPurchase = !!bookingId

    // Insert review
    const [newReview] = await db
      .insert(reviews)
      .values({
        reviewerId: session.user.id,
        targetType,
        targetId,
        bookingId: bookingId || null,
        overallRating,
        communicationRating: communicationRating || null,
        professionalismRating: professionalismRating || null,
        qualityRating: qualityRating || null,
        timelinessRating: timelinessRating || null,
        valueRating: valueRating || null,
        title: title || null,
        content,
        isVerifiedPurchase: verifiedPurchase,
        status: REVIEW_STATUS.PUBLISHED,
      })
      .returning({ id: reviews.id })

    const reviewId = newReview.id

    // Post-creation side-effects
    if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
      await updateHelperAverageRating(targetId)
    }

    if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
      await notifyRepairerOfReview(
        targetId,
        reviewId,
        session.user.name || 'Kunde',
        overallRating,
        content
      )
    }

    logger.info('Review created', {
      reviewId, reviewerId: session.user.id, targetType, targetId, overallRating,
    })

    return apiSuccess({ message: 'Bewertung erfolgreich erstellt', reviewId }, 201)
  } catch (error) {
    logger.error('Error creating review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
