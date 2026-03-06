import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { HandleReportSchema } from '@/lib/schemas/marketplace'
import { removeListing } from '@/lib/search/meilisearch'
import { logger } from '@/lib/logger'
import { logAdminAction } from '@/lib/auth/audit'
import { getClientIdentifier } from '@/lib/security/rate-limit'

// PATCH /api/admin/marketplace/reports/[id] - Handle a report
export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(HandleReportSchema, body)
    if (!validation.success) return validation.error

    const { action, admin_notes } = validation.data

    // Get report with listing info
    const reportResult = await query<{ id: string; listing_id: string; status: string }>(
      `SELECT lr.id, lr.listing_id, lr.status
       FROM ${TABLE_NAMES.LISTING_REPORTS} lr
       WHERE lr.id = $1`,
      [id]
    )

    if (reportResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REPORT_NOT_FOUND)
    }

    const report = reportResult.rows[0]

    // Mark report as reviewed
    await query(
      `UPDATE ${TABLE_NAMES.LISTING_REPORTS}
       SET status = 'reviewed',
           reviewed_at = NOW(),
           reviewed_by = $1,
           resolution_action = $2,
           resolution_notes = $3
       WHERE id = $4`,
      [session.user.id, action, admin_notes || null, id]
    )

    // Apply action
    if (action === 'remove_listing') {
      await query(
        `UPDATE ${TABLE_NAMES.LISTINGS}
         SET status = 'removed', updated_at = NOW()
         WHERE id = $1`,
        [report.listing_id]
      )
      await removeListing(report.listing_id)
    }

    logger.info('Admin handled report', {
      reportId: id,
      listingId: report.listing_id,
      action,
      adminEmail: session.user.email,
    })

    // Audit trail
    logAdminAction({
      userId: session.user.id,
      ipAddress: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    }, 'marketplace_report_handled', {
      reportId: id,
      listingId: report.listing_id,
      action,
      adminNotes: admin_notes,
    })

    return apiSuccess({ handled: true, action })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
