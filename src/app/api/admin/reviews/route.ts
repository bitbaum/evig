/**
 * GET /api/admin/reviews?status=<status>&limit=<n>
 *
 * Lists reviews for the admin moderation page (src/app/admin/reviews +
 * useAdminReviews). Returns the camelCase `{ reviews: Review[] }` shape the
 * hook expects. Staff-only via withAdmin('reviews').
 *
 * targetName is resolved polymorphically: 'repairer' → repairer_profiles,
 * 'workshop' → workshops; any other target type falls back to a readable
 * label so the row never renders blank.
 */
import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses } from '@/db/schema/reviews'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { workshops } from '@/db/schema/workshops'
import { eq, and, desc, sql } from 'drizzle-orm'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { REVIEW_STATUS, REVIEW_STATUS_VALUES, type ReviewStatus } from '@/config/review-status'
import { REVIEW_TARGET_TYPES } from '@/config/database'

export const GET = withAdmin('reviews', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)

    const statusParam = searchParams.get('status')
    const status: ReviewStatus =
      statusParam && (REVIEW_STATUS_VALUES as readonly string[]).includes(statusParam)
        ? (statusParam as ReviewStatus)
        : REVIEW_STATUS.PENDING_MODERATION

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)

    // Author of the (published) response, if any.
    const responder = db.select({ id: users.id, name: users.name }).from(users).as('responder')

    const rows = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        reviewerName: users.name,
        reviewerEmail: users.email,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        targetName: sql<string>`COALESCE(${repairerProfiles.businessName}, ${workshops.title}, initcap(${reviews.targetType}))`,
        overallRating: reviews.overallRating,
        title: reviews.title,
        content: reviews.content,
        status: reviews.status,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        moderationReason: reviews.moderationReason,
        moderatedBy: reviews.moderatedBy,
        moderatedAt: reviews.moderatedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        responseContent: reviewResponses.content,
        responseCreatedAt: reviewResponses.createdAt,
        responderName: responder.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(
        repairerProfiles,
        and(eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER), eq(reviews.targetId, repairerProfiles.id))
      )
      .leftJoin(
        workshops,
        and(eq(reviews.targetType, REVIEW_TARGET_TYPES.WORKSHOP), eq(reviews.targetId, workshops.id))
      )
      .leftJoin(
        reviewResponses,
        and(eq(reviewResponses.reviewId, reviews.id), eq(reviewResponses.status, REVIEW_STATUS.PUBLISHED))
      )
      .leftJoin(responder, eq(reviewResponses.responderId, responder.id))
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)

    const reviewsList = rows.map(r => ({
      id: r.id,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewerName ?? '',
      reviewerEmail: r.reviewerEmail ?? '',
      targetType: r.targetType,
      targetId: r.targetId,
      targetName: r.targetName ?? '',
      overallRating: r.overallRating,
      title: r.title ?? undefined,
      content: r.content,
      status: r.status,
      helpfulVotes: r.helpfulVotes,
      totalVotes: r.totalVotes,
      isVerifiedPurchase: r.isVerifiedPurchase,
      moderationReason: r.moderationReason ?? undefined,
      moderatedBy: r.moderatedBy ?? undefined,
      moderatedAt: r.moderatedAt ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      response: r.responseContent
        ? {
            content: r.responseContent,
            responderName: r.responderName ?? '',
            createdAt: r.responseCreatedAt,
          }
        : undefined,
    }))

    return apiSuccess({ reviews: reviewsList })
  } catch (error) {
    return apiError(error, 'Bewertungen konnten nicht geladen werden')
  }
})
