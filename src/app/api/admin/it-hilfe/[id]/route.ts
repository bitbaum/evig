import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { itHilfeRequests, itHilfeOffers, users } from '@/db/schema'
import { eq, and, notInArray, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REQUEST_STATUS, VALID_REQUEST_TRANSITIONS } from '@/config/it-hilfe'
import { validateBody } from '@/lib/schemas'
import { AdminEditRequestSchema } from '@/lib/schemas/it-hilfe'
import { logger } from '@/lib/logger'
import { logActivity } from '@/lib/activity'

// GET /api/admin/it-hilfe/[id] - Request detail with offers
export const GET = withAdmin<{ id: string }>('it-hilfe-admin', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const [request] = await db
      .select({
        id: itHilfeRequests.id,
        requesterId: itHilfeRequests.requesterId,
        categoryId: itHilfeRequests.categoryId,
        deviceBrand: itHilfeRequests.deviceBrand,
        deviceModel: itHilfeRequests.deviceModel,
        title: itHilfeRequests.title,
        description: itHilfeRequests.description,
        urgency: itHilfeRequests.urgency,
        budgetType: itHilfeRequests.budgetType,
        budgetAmountCents: itHilfeRequests.budgetAmountCents,
        postalCode: itHilfeRequests.postalCode,
        city: itHilfeRequests.city,
        canton: itHilfeRequests.canton,
        serviceType: itHilfeRequests.serviceType,
        skillsNeeded: itHilfeRequests.skillsNeeded,
        imageUrls: itHilfeRequests.imageUrls,
        status: itHilfeRequests.status,
        matchedOfferId: itHilfeRequests.matchedOfferId,
        offerCount: itHilfeRequests.offerCount,
        serviceCategory: itHilfeRequests.serviceCategory,
        aiDiagnosis: itHilfeRequests.aiDiagnosis,
        adminNotes: itHilfeRequests.adminNotes,
        expiresAt: itHilfeRequests.expiresAt,
        createdAt: itHilfeRequests.createdAt,
        updatedAt: itHilfeRequests.updatedAt,
        requester_name: users.name,
        requester_email: users.email,
      })
      .from(itHilfeRequests)
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .where(eq(itHilfeRequests.id, id))

    if (!request) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    // Fetch offers with helper info
    const offers = await db
      .select({
        id: itHilfeOffers.id,
        message: itHilfeOffers.message,
        status: itHilfeOffers.status,
        estimatedTime: itHilfeOffers.estimatedTime,
        proposedCompensation: itHilfeOffers.proposedCompensation,
        createdAt: itHilfeOffers.createdAt,
        helper_name: users.name,
        helper_email: users.email,
      })
      .from(itHilfeOffers)
      .innerJoin(users, eq(itHilfeOffers.helperId, users.id))
      .where(eq(itHilfeOffers.requestId, id))

    return apiSuccess({
      ...request,
      offers,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// PATCH /api/admin/it-hilfe/[id] - Edit/moderate request
export const PATCH = withAdmin<{ id: string }>('it-hilfe-admin', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(AdminEditRequestSchema, body)
    if (!validation.success) return validation.error

    const data = validation.data
    const update: Record<string, unknown> = {}

    if (data.title !== undefined) update.title = data.title
    if (data.description !== undefined) update.description = data.description
    if (data.urgency !== undefined) update.urgency = data.urgency
    if (data.admin_notes !== undefined) update.adminNotes = data.admin_notes

    // Validate status transitions (admins can also cancel any non-terminal request)
    if (data.status !== undefined) {
      const [current] = await db
        .select({ status: itHilfeRequests.status })
        .from(itHilfeRequests)
        .where(eq(itHilfeRequests.id, id))

      if (!current) return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)

      const allowed = VALID_REQUEST_TRANSITIONS[current.status as string] || []
      const isAdminCancel = data.status === REQUEST_STATUS.CANCELLED &&
        current.status !== REQUEST_STATUS.COMPLETED && current.status !== REQUEST_STATUS.CANCELLED

      if (!allowed.includes(data.status) && !isAdminCancel) {
        return apiBadRequest(`Status kann nicht von "${current.status}" auf "${data.status}" geändert werden`)
      }

      update.status = data.status
    }

    if (Object.keys(update).length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    update.updatedAt = sql`NOW()`

    const [updated] = await db
      .update(itHilfeRequests)
      .set(update)
      .where(eq(itHilfeRequests.id, id))
      .returning()

    if (!updated) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    logger.info('Admin edited IT-Hilfe request', {
      requestId: id,
      adminEmail: session.user.email,
      changes: Object.keys(data),
    })

    if (data.status === REQUEST_STATUS.COMPLETED) {
      logActivity({
        actorId: session.user.id,
        action: 'closed_it_hilfe',
        subjectType: 'it_hilfe',
        subjectId: id,
        subjectLabel: updated.title ?? undefined,
      })
    }

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// DELETE /api/admin/it-hilfe/[id] - Cancel request
export const DELETE = withAdmin<{ id: string }>('it-hilfe-admin', async (_request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const [cancelled] = await db
      .update(itHilfeRequests)
      .set({
        status: REQUEST_STATUS.CANCELLED,
        updatedAt: sql`NOW()`,
        adminNotes: sql`COALESCE(${itHilfeRequests.adminNotes}, '') || ' [Admin-storniert]'`,
      })
      .where(and(
        eq(itHilfeRequests.id, id),
        notInArray(itHilfeRequests.status, [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.CANCELLED])
      ))
      .returning({ id: itHilfeRequests.id })

    if (!cancelled) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    logger.info('Admin cancelled IT-Hilfe request', {
      requestId: id,
      adminEmail: session.user.email,
    })

    return apiSuccess({ cancelled: true })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
