import { db } from '@/db'
import { listingReports, listings } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { HandleReportSchema } from '@/lib/schemas/marketplace'
import { REPORT_STATUS } from '@/config/report-status'
import { LISTING_STATUS } from '@/config/marketplace'
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
    const [report] = await db
      .select({
        id: listingReports.id,
        listing_id: listingReports.listingId,
        status: listingReports.status,
      })
      .from(listingReports)
      .where(eq(listingReports.id, id))

    if (!report) {
      return apiNotFound(ERROR_MESSAGES.REPORT_NOT_FOUND)
    }

    // Mark report as reviewed
    await db
      .update(listingReports)
      .set({
        status: REPORT_STATUS.REVIEWED,
        reviewedAt: sql`NOW()`,
        reviewedBy: session.user.id,
        resolutionAction: action,
        resolutionNotes: admin_notes || null,
      })
      .where(eq(listingReports.id, id))

    // Apply action
    if (action === 'remove_listing') {
      await db
        .update(listings)
        .set({
          status: LISTING_STATUS.REMOVED,
          updatedAt: sql`NOW()`,
        })
        .where(eq(listings.id, report.listing_id))
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
