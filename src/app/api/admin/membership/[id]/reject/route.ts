/**
 * POST /api/admin/membership/[id]/reject
 *
 * Rejects a membership application.
 * - Updates status to 'rejected'
 * - Accepts optional admin_notes with rejection reason
 * - Records reviewedBy and reviewedAt
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

type RouteContext = { params?: { id: string } }

export const POST = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Mitgliedschaftsantrag')

    // Parse optional body for admin_notes
    let adminNotes: string | null = null
    try {
      const body = await request.json()
      if (body?.admin_notes && typeof body.admin_notes === 'string') {
        adminNotes = body.admin_notes.trim() || null
      }
    } catch {
      // Body is optional — ignore parse errors
    }

    // Fetch the application
    const appResult = await query<{
      id: string
      applicant_email: string
      status: string
    }>(
      `SELECT id, applicant_email, status
       FROM ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
       WHERE id = $1`,
      [id]
    )

    const application = appResult.rows[0]
    if (!application) return apiNotFound('Mitgliedschaftsantrag')

    if (application.status !== 'pending') {
      return apiError(
        new Error(`Antrag hat bereits Status: ${application.status}`),
        'Dieser Antrag wurde bereits bearbeitet'
      )
    }

    await query(
      `UPDATE ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
       SET status = 'rejected',
           admin_notes = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [adminNotes, session.user.id, id]
    )

    logger.info('Membership application rejected', {
      applicationId: id,
      applicantEmail: application.applicant_email,
      reviewedBy: session.user.id,
      hasNotes: !!adminNotes,
    })

    return apiSuccess({ id, status: 'rejected' })
  } catch (error) {
    return apiError(error, 'Fehler beim Ablehnen des Mitgliedschaftsantrags')
  }
})
