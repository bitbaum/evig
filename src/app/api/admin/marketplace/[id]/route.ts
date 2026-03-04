import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { AdminEditListingSchema } from '@/lib/schemas/marketplace'
import { removeListing } from '@/lib/search/meilisearch'
import { logger } from '@/lib/logger'

// GET /api/admin/marketplace/[id] - Full listing detail
export const GET = withAdmin<{ id: string }>('marketplace', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const listingResult = await query(
      `SELECT
        l.*,
        u.name as seller_name, u.email as seller_email,
        (SELECT json_agg(json_build_object('id', li.id, 'url', li.image_url, 'position', li.position))
         FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id) as images,
        (SELECT json_agg(json_build_object('id', ls.id, 'key', ls.key, 'value', ls.value, 'unit', ls.unit))
         FROM ${TABLE_NAMES.LISTING_SPECS} ls WHERE ls.listing_id = l.id) as specs,
        (SELECT json_agg(json_build_object(
           'id', lr.id, 'reason', lr.reason, 'details', lr.details, 'status', lr.status,
           'created_at', lr.created_at, 'reporter_name', ru.name, 'reporter_email', ru.email
         )) FROM ${TABLE_NAMES.LISTING_REPORTS} lr
         JOIN ${TABLE_NAMES.USERS} ru ON lr.reporter_id = ru.id
         WHERE lr.listing_id = l.id) as reports
      FROM ${TABLE_NAMES.LISTINGS} l
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      WHERE l.id = $1`,
      [id]
    )

    if (listingResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    return apiSuccess(listingResult.rows[0])
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
    const setClauses: string[] = []
    const params: (string | number | null)[] = []

    if (data.title !== undefined) {
      setClauses.push(`title = $${params.length + 1}`)
      params.push(data.title)
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${params.length + 1}`)
      params.push(data.description)
    }
    if (data.price_chf !== undefined) {
      setClauses.push(`price_chf = $${params.length + 1}`)
      params.push(data.price_chf)
    }
    if (data.category !== undefined) {
      setClauses.push(`category = $${params.length + 1}`)
      params.push(data.category)
    }
    if (data.condition !== undefined) {
      setClauses.push(`condition = $${params.length + 1}`)
      params.push(data.condition)
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${params.length + 1}`)
      params.push(data.status)
    }
    if (data.admin_notes !== undefined) {
      setClauses.push(`admin_notes = $${params.length + 1}`)
      params.push(data.admin_notes)
    }

    if (setClauses.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    setClauses.push(`updated_at = NOW()`)
    params.push(id)

    const result = await query(
      `UPDATE ${TABLE_NAMES.LISTINGS}
       SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    )

    if (result.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    logger.info('Admin edited listing', {
      listingId: id,
      adminEmail: session.user.email,
      changes: Object.keys(data),
    })

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// DELETE /api/admin/marketplace/[id] - Soft delete (set status='removed')
export const DELETE = withAdmin<{ id: string }>('marketplace', async (_request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const result = await query(
      `UPDATE ${TABLE_NAMES.LISTINGS}
       SET status = 'removed', updated_at = NOW()
       WHERE id = $1 AND status != 'removed'
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.LISTING_NOT_FOUND)
    }

    // Remove from Meilisearch
    await removeListing(id)

    logger.info('Admin removed listing', {
      listingId: id,
      adminEmail: session.user.email,
    })

    return apiSuccess({ removed: true })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
