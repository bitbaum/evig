import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshopProposals, users, locations } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'

// GET /api/admin/workshops/proposals - List workshop proposals with filtering
export const GET = withAdmin('workshops-admin', async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || APPROVAL_STATUS.PENDING
    const category = searchParams.get('category')
    const { limit, offset } = parsePagination(request)

    const conditions: SQL[] = []
    if (status !== 'all') conditions.push(eq(workshopProposals.status, status))
    if (category) conditions.push(eq(workshopProposals.category, category))

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined

    // Count total
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workshopProposals)
      .where(where)

    const total = Number(countRow?.count ?? 0)

    // Fetch proposals
    const rows = await db
      .select({
        id: workshopProposals.id,
        userId: workshopProposals.userId,
        title: workshopProposals.title,
        description: workshopProposals.description,
        shortDescription: workshopProposals.shortDescription,
        category: workshopProposals.category,
        durationMinutes: workshopProposals.durationMinutes,
        level: workshopProposals.level,
        maxParticipants: workshopProposals.maxParticipants,
        minParticipants: workshopProposals.minParticipants,
        priceCents: workshopProposals.priceCents,
        prerequisites: workshopProposals.prerequisites,
        learningObjectives: workshopProposals.learningObjectives,
        targetAudience: workshopProposals.targetAudience,
        materialsProvided: workshopProposals.materialsProvided,
        materialsRequired: workshopProposals.materialsRequired,
        locationType: workshopProposals.locationType,
        selectedLocationId: workshopProposals.selectedLocationId,
        proposedLocation: workshopProposals.proposedLocation,
        proposedDate: workshopProposals.proposedDate,
        proposedTime: workshopProposals.proposedTime,
        specialRequirements: workshopProposals.specialRequirements,
        termsAccepted: workshopProposals.termsAccepted,
        status: workshopProposals.status,
        adminNotes: workshopProposals.adminNotes,
        reviewedBy: workshopProposals.reviewedBy,
        reviewedAt: workshopProposals.reviewedAt,
        createdAt: workshopProposals.createdAt,
        updatedAt: workshopProposals.updatedAt,
        proposerName: users.name,
        proposerEmail: users.email,
        selectedLocationName: locations.name,
      })
      .from(workshopProposals)
      .leftJoin(users, eq(workshopProposals.userId, users.id))
      .leftJoin(locations, eq(workshopProposals.selectedLocationId, locations.id))
      .where(where)
      .orderBy(desc(workshopProposals.createdAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess({
      items: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
