import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: certificationId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is admin using SSOT helper
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    if (!userResult.rows[0] || !isAdminRole(userResult.rows[0].role)) {
      return apiUnauthorized('Nur Administratoren können diese Funktion verwenden')
    }
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required inputs
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest('Ein Ablehnungsgrund ist erforderlich')
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get certification details
    const certificationResult = await query(`
      SELECT rc.*, ra.user_id
      FROM ${TABLE_NAMES.REPAIRER_CERTIFICATIONS} rc
      JOIN ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra ON rc.application_id = ra.id
      WHERE rc.id = $1
    `, [certificationId])

    if (certificationResult.rows.length === 0) {
      return apiNotFound('Zertifizierung nicht gefunden')
    }

    const certification = certificationResult.rows[0]

    if (certification.verification_status === 'verified') {
      return apiBadRequest('Eine bereits verifizierte Zertifizierung kann nicht abgelehnt werden')
    }

    if (certification.verification_status === 'rejected') {
      return apiBadRequest('Diese Zertifizierung wurde bereits abgelehnt')
    }

    // Update certification verification status with rejection details
    await query(`
      UPDATE ${TABLE_NAMES.REPAIRER_CERTIFICATIONS}
      SET
        verification_status = 'rejected',
        verification_result = jsonb_build_object('rejectionReason', $1, 'rejectedAt', CURRENT_TIMESTAMP),
        admin_notes = COALESCE($2, admin_notes),
        verified_by = $3,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [rejectionReason, adminNotes, session.user.id, certificationId])

    logger.info('Certification rejected', {
      certificationId,
      adminId: session.user.id,
      applicationId: certification.application_id,
      userId: certification.user_id,
      rejectionReason
    })

    return apiSuccess({
      message: 'Zertifizierung erfolgreich abgelehnt',
      certificationId
    })

  } catch (error) {
    logger.error('Error rejecting certification', { error, certificationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}