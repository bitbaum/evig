import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CERTIFICATION_STATUS } from '@/config/certification-status'
import { logger } from '@/lib/logger'

interface CertificationRow {
  id: string
  application_id: string
  user_id: string
  verification_status: string
}

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: certificationId } = context!.params!
  try {
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

    const certification = certificationResult.rows[0] as CertificationRow

    if (certification.verification_status === CERTIFICATION_STATUS.VERIFIED) {
      return apiBadRequest('Eine bereits verifizierte Zertifizierung kann nicht abgelehnt werden')
    }

    if (certification.verification_status === CERTIFICATION_STATUS.REJECTED) {
      return apiBadRequest('Diese Zertifizierung wurde bereits abgelehnt')
    }

    // Update certification verification status with rejection details
    await query(`
      UPDATE ${TABLE_NAMES.REPAIRER_CERTIFICATIONS}
      SET
        verification_status = '${CERTIFICATION_STATUS.REJECTED}',
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
})