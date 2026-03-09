import { db } from '@/db'
import { listings, listingImages, listingSpecs, listingReports, users } from '@/db/schema'
import { eq, ne, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { AdminEditListingSchema } from '@/lib/schemas/marketplace'
import { removeListing } from '@/lib/search/meilisearch'
import { logger } from '@/lib/logger'
import { logAdminAction } from '@/lib/auth/audit'
import { getClientIdentifier } from '@/lib/security/rate-limit'

// GET /api/admin/marketplace/[id] - Full listing detail
export const GET = withAdmin<{ id: string }>('marketplace', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    // Fetch listing with seller info
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))

    if (!listing) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    // Fetch seller info
    const [seller] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, listing.sellerId))

    // Fetch images, specs, reports in parallel
    const [images, specs, reports] = await Promise.all([
      db
        .select({ id: listingImages.id, url: listingImages.url, position: listingImages.position })
        .from(listingImages)
        .where(eq(listingImages.listingId, id)),
      db
        .select({ id: listingSpecs.id, key: listingSpecs.specKey, value: listingSpecs.specValue, unit: listingSpecs.specUnit })
        .from(listingSpecs)
        .where(eq(listingSpecs.listingId, id)),
      db
        .select({
          id: listingReports.id,
          reason: listingReports.reason,
          details: listingReports.details,
          status: listingReports.status,
          created_at: listingReports.createdAt,
          reporter_name: users.name,
          reporter_email: users.email,
        })
        .from(listingReports)
        .innerJoin(users, eq(listingReports.reporterId, users.id))
        .where(eq(listingReports.listingId, id)),
    ])

    return apiSuccess({
      ...listing,
      seller_name: seller?.name,
      seller_email: seller?.email,
      images: images.length > 0 ? images : null,
      specs: specs.length > 0 ? specs : null,
      reports: reports.length > 0 ? reports : null,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// PATCH /api/admin/marketplace/[id] - Edit listing
export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(AdminEditListingSchema, body)
    if (!validation.success) return validation.error

    const data = validation.data
    const update: Record<string, unknown> = {}

    if (data.title !== undefined) update.title = data.title
    if (data.description !== undefined) update.description = data.description
    if (data.price_chf !== undefined) update.priceChf = String(data.price_chf)
    if (data.category !== undefined) update.category = data.category
    if (data.condition !== undefined) update.condition = data.condition
    if (data.status !== undefined) update.status = data.status
    if (data.admin_notes !== undefined) update.adminNotes = data.admin_notes

    if (Object.keys(update).length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    update.updatedAt = sql`NOW()`

    const [updated] = await db
      .update(listings)
      .set(update)
      .where(eq(listings.id, id))
      .returning()

    if (!updated) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    logger.info('Admin edited listing', {
      listingId: id,
      adminEmail: session.user.email,
      changes: Object.keys(data),
    })

    // Audit trail
    logAdminAction({
      userId: session.user.id,
      ipAddress: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    }, 'marketplace_listing_edited', {
      listingId: id,
      changes: Object.keys(data),
      newValues: data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// DELETE /api/admin/marketplace/[id] - Soft delete (set status='removed')
export const DELETE = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const [removed] = await db
      .update(listings)
      .set({ status: 'removed', updatedAt: sql`NOW()` })
      .where(eq(listings.id, id))
      .returning({ id: listings.id })

    if (!removed) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    // Remove from Meilisearch
    await removeListing(id)

    logger.info('Admin removed listing', {
      listingId: id,
      adminEmail: session.user.email,
    })

    // Audit trail
    logAdminAction({
      userId: session.user.id,
      ipAddress: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    }, 'marketplace_listing_removed', {
      listingId: id,
    })

    return apiSuccess({ removed: true })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
