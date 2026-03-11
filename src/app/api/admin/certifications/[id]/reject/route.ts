import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { CERTIFICATION_STATUS } from '@/config/certification-status'
import { logger } from '@/lib/logger'
import { validateBody, CertificationRejectSchema } from '@/lib/schemas'

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
    const validation = validateBody(CertificationRejectSchema, body)
    if (!validation.success) return validation.error
    const { adminNotes, rejectionReason } = validation.data

    // Get certification details
    const certificationResult = await db.execute(sql`
      SELECT rc.*, ra.user_id
      FROM repairer_certifications rc
      JOIN repairer_applications ra ON rc.application_id = ra.id
      WHERE rc.id = ${certificationId}
    `)

    if (certificationResult.rows.length === 0) {
      return apiNotFound('Zertifizierung nicht gefunden')
    }

    const certification = certificationResult.rows[0] as unknown as CertificationRow

    if (certification.verification_status === CERTIFICATION_STATUS.VERIFIED) {
      return apiBadRequest('Eine bereits verifizierte Zertifizierung kann nicht abgelehnt werden')
    }

    if (certification.verification_status === CERTIFICATION_STATUS.REJECTED) {
      return apiBadRequest('Diese Zertifizierung wurde bereits abgelehnt')
    }

    // Update certification verification status with rejection details
    await db.execute(sql`
      UPDATE repairer_certifications
      SET
        verification_status = ${CERTIFICATION_STATUS.REJECTED},
        verification_result = jsonb_build_object('rejectionReason', ${rejectionReason}, 'rejectedAt', CURRENT_TIMESTAMP),
        admin_notes = COALESCE(${adminNotes}, admin_notes),
        verified_by = ${session.user.id},
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${certificationId}
    `)

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
