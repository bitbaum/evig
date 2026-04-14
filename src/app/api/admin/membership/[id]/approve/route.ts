/**
 * POST /api/admin/membership/[id]/approve
 *
 * Approves a membership application.
 * - Sets application status to 'approved'
 * - If user_id exists: activates membership on users table
 * - If no user_id: tries to find user by email, links if found
 * - Records reviewedBy and reviewedAt
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { MEMBERSHIP_APPLICATION_STATUS } from '@/config/membership-status'

type RouteContext = { params?: { id: string } }

export const POST = withAdmin<{ id: string }>(async (
  _request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Mitgliedschaftsantrag')

    // Fetch the application
    const appResult = await query<{
      id: string
      user_id: string | null
      applicant_email: string
      member_type: string
      status: string
    }>(
      `SELECT id, user_id, applicant_email, member_type, status
       FROM ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
       WHERE id = $1`,
      [id]
    )

    const application = appResult.rows[0]
    if (!application) return apiNotFound('Mitgliedschaftsantrag')

    if (application.status !== MEMBERSHIP_APPLICATION_STATUS.PENDING) {
      return apiError(
        new Error(`Antrag hat bereits Status: ${application.status}`),
        'Dieser Antrag wurde bereits bearbeitet'
      )
    }

    let userId = application.user_id

    // If no user_id, try to find by email
    if (!userId) {
      const userResult = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1 LIMIT 1`,
        [application.applicant_email]
      )
      if (userResult.rows[0]) {
        userId = userResult.rows[0].id
      }
    }

    // Update membership application status
    await query(
      `UPDATE ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [MEMBERSHIP_APPLICATION_STATUS.APPROVED, session.user.id, id]
    )

    // Activate membership on users table if we have a user
    if (userId) {
      await query(
        `UPDATE ${TABLE_NAMES.USERS}
         SET is_member = true,
             member_since = NOW(),
             member_type = $1
         WHERE id = $2`,
        [application.member_type, userId]
      )

      // Also link user_id on the application if it wasn't set
      if (!application.user_id) {
        await query(
          `UPDATE ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
           SET user_id = $1
           WHERE id = $2`,
          [userId, id]
        )
      }
    }

    logger.info('Membership application approved', {
      applicationId: id,
      applicantEmail: application.applicant_email,
      userId,
      reviewedBy: session.user.id,
      userFound: !!userId,
    })

    return apiSuccess({
      id,
      status: MEMBERSHIP_APPLICATION_STATUS.APPROVED,
      userActivated: !!userId,
      message: userId
        ? 'Mitgliedschaft genehmigt und Konto aktiviert'
        : 'Antrag genehmigt — kein Benutzerkonto gefunden, bitte manuell erstellen',
    })
  } catch (error) {
    return apiError(error, 'Fehler beim Genehmigen des Mitgliedschaftsantrags')
  }
})
