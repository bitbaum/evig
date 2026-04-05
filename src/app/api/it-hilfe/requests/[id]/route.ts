import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeRequests, helperProfiles, itHilfeOffers, users } from '@/db/schema'
import { alias } from 'drizzle-orm/pg-core'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, VALID_REQUEST_TRANSITIONS, deriveBudgetType } from '@/config/it-hilfe'
import { validateBody, UpdateITHilfeRequestSchema } from '@/lib/schemas'
import { type RequestRow, mapRequestDetailRow } from '@/lib/it-hilfe/request-mapper'
import { sendItHilfeNotification } from '@/lib/it-hilfe/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/it-hilfe/requests/[id]
 * Get request details (public)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    // Use explicit snake_case aliases to match the RequestRow mapper interface
    const matchedOffer = alias(itHilfeOffers, 'matched_offer')
    const [row] = await db
      .select({
        id: itHilfeRequests.id,
        requester_id: itHilfeRequests.requesterId,
        requester_name: users.name,
        requester_email: users.email,
        category_id: itHilfeRequests.categoryId,
        device_brand: itHilfeRequests.deviceBrand,
        device_model: itHilfeRequests.deviceModel,
        title: itHilfeRequests.title,
        description: itHilfeRequests.description,
        urgency: itHilfeRequests.urgency,
        budget_type: itHilfeRequests.budgetType,
        budget_amount_cents: itHilfeRequests.budgetAmountCents,
        postal_code: itHilfeRequests.postalCode,
        city: itHilfeRequests.city,
        canton: itHilfeRequests.canton,
        service_type: itHilfeRequests.serviceType,
        skills_needed: itHilfeRequests.skillsNeeded,
        image_urls: itHilfeRequests.imageUrls,
        status: itHilfeRequests.status,
        matched_offer_id: itHilfeRequests.matchedOfferId,
        matched_helper_id: matchedOffer.helperId,
        offer_count: itHilfeRequests.offerCount,
        ai_diagnosis: itHilfeRequests.aiDiagnosis,
        completed_at: itHilfeRequests.completedAt,
        completed_by: itHilfeRequests.completedBy,
        reviewed_at: itHilfeRequests.reviewedAt,
        expires_at: itHilfeRequests.expiresAt,
        created_at: itHilfeRequests.createdAt,
        updated_at: itHilfeRequests.updatedAt,
      })
      .from(itHilfeRequests)
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .leftJoin(matchedOffer, eq(itHilfeRequests.matchedOfferId, matchedOffer.id))
      .where(eq(itHilfeRequests.id, id))

    if (!row) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    // Get current user to check ownership
    const session = await auth()
    const isOwner = session?.user?.id === row.requester_id
    const requestData = mapRequestDetailRow(row as RequestRow, isOwner)

    logger.info('Fetched IT-Hilfe request details', { requestId: id })

    return apiSuccess({ request: requestData })
  } catch (error) {
    logger.error('Error fetching IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * PUT /api/it-hilfe/requests/[id]
 * Update request (owner only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    // Check ownership and current status
    const [existing] = await db
      .select({
        requesterId: itHilfeRequests.requesterId,
        status: itHilfeRequests.status,
        title: itHilfeRequests.title,
        matchedOfferId: itHilfeRequests.matchedOfferId,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!existing) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    if (existing.requesterId !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Anfragen bearbeiten')
    }

    const body = await request.json()
    const validation = validateBody(UpdateITHilfeRequestSchema, body)
    if (!validation.success) return validation.error
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency,
      budgetAmountCents,
      maxBudgetCents,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded,
      imageUrls,
      status,
    } = validation.data

    // Status-only updates (completion, cancellation) are allowed on matched requests
    const isStatusOnlyUpdate = status && Object.keys(body).length === 1

    // Only allow editing open or in_discussion requests (unless it's a status transition)
    if (existing.status !== REQUEST_STATUS.OPEN && existing.status !== REQUEST_STATUS.IN_DISCUSSION && !isStatusOnlyUpdate) {
      return apiBadRequest('Diese Anfrage kann nicht mehr bearbeitet werden')
    }

    // Support both old and new field names
    const effectiveBudgetCents = maxBudgetCents ?? budgetAmountCents

    // Build dynamic update set
    const updateSet: Record<string, unknown> = {}

    if (categoryId !== undefined) updateSet.categoryId = categoryId
    if (deviceBrand !== undefined) updateSet.deviceBrand = deviceBrand || null
    if (deviceModel !== undefined) updateSet.deviceModel = deviceModel || null
    if (title !== undefined) updateSet.title = title
    if (description !== undefined) updateSet.description = description || ''
    if (urgency !== undefined) updateSet.urgency = urgency
    if (postalCode !== undefined) updateSet.postalCode = postalCode
    if (city !== undefined) updateSet.city = city
    if (canton !== undefined) updateSet.canton = canton
    if (serviceType !== undefined) updateSet.serviceType = serviceType
    if (skillsNeeded !== undefined) updateSet.skillsNeeded = skillsNeeded.length > 0 ? skillsNeeded : null
    if (imageUrls !== undefined) updateSet.imageUrls = imageUrls.length > 0 ? imageUrls : null

    // Simplified budget: just maxBudget amount (null/0 = free, >0 = paid)
    if (effectiveBudgetCents !== undefined) {
      const amount = effectiveBudgetCents && effectiveBudgetCents > 0 ? effectiveBudgetCents : null
      updateSet.budgetAmountCents = amount
      updateSet.budgetType = deriveBudgetType(amount)
    }

    // Status transitions
    if (status !== undefined) {
      const allowed = VALID_REQUEST_TRANSITIONS[existing.status as string] || []

      if (!allowed.includes(status)) {
        return apiBadRequest(`Status kann nicht von "${existing.status}" auf "${status}" geändert werden`)
      }

      updateSet.status = status

      // Increment helper's total_helps_completed when completing
      if (status === REQUEST_STATUS.COMPLETED) {
        try {
          await db
            .update(helperProfiles)
            .set({ totalHelpsCompleted: sql`${helperProfiles.totalHelpsCompleted} + 1` })
            .where(sql`${helperProfiles.userId} IN (
              SELECT o.helper_id FROM ${itHilfeOffers} o
              JOIN ${itHilfeRequests} r ON r.matched_offer_id = o.id
              WHERE r.id = ${id}
            )`)
        } catch (err) {
          logger.error('Error incrementing total_helps_completed', { error: err, requestId: id })
        }

        // Notify matched helper about completion
        if (existing.matchedOfferId) {
          db.select({ helperId: itHilfeOffers.helperId })
            .from(itHilfeOffers)
            .where(eq(itHilfeOffers.id, existing.matchedOfferId))
            .then(([offer]) => {
              if (offer) {
                sendItHilfeNotification({
                  recipientIds: [offer.helperId],
                  title: `Anfrage "${existing.title}" abgeschlossen`,
                  content: 'Die Anfrage wurde als abgeschlossen markiert. Vielen Dank für deine Hilfe!',
                  requestId: id,
                })
              }
            })
            .catch(err => logger.error('Failed to notify helper on completion', { error: err, requestId: id }))
        }
      }
    }

    if (Object.keys(updateSet).length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    await db
      .update(itHilfeRequests)
      .set(updateSet)
      .where(eq(itHilfeRequests.id, id))

    logger.info('Updated IT-Hilfe request', {
      requestId: id,
      userId: session.user.id,
      updates: Object.keys(updateSet).length,
    })

    return apiSuccess({
      message: 'IT-Hilfe-Anfrage erfolgreich aktualisiert',
    })
  } catch (error) {
    logger.error('Error updating IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
