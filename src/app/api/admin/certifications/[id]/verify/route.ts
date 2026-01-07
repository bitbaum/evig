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
  { params }: { params: { id: string } }
) {
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

    const certificationId = params.id
    const body = await request.json()
    const { adminNotes, verificationResult } = body

    // Validate inputs
    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get certification details
    const certificationResult = await query(`
      SELECT rc.*, ra.user_id, ct.validity_period_months
      FROM repairer_certifications rc
      JOIN repairer_applications ra ON rc.application_id = ra.id
      LEFT JOIN certification_types ct ON rc.certification_type_id = ct.id
      WHERE rc.id = $1
    `, [certificationId])

    if (certificationResult.rows.length === 0) {
      return apiNotFound('Zertifizierung nicht gefunden')
    }

    const certification = certificationResult.rows[0]

    if (certification.verification_status === 'verified') {
      return apiBadRequest('Diese Zertifizierung wurde bereits verifiziert')
    }

    // Calculate expiry date if certification type has validity period and no expiry date is set
    let calculatedExpiryDate = certification.expiry_date
    if (!calculatedExpiryDate && certification.validity_period_months && certification.issue_date) {
      const issueDate = new Date(certification.issue_date)
      calculatedExpiryDate = new Date(issueDate.getTime() + (certification.validity_period_months * 30 * 24 * 60 * 60 * 1000))
    }

    // Update certification verification status
    await query(`
      UPDATE repairer_certifications
      SET
        verification_status = 'verified',
        verification_result = COALESCE($1, verification_result),
        admin_notes = COALESCE($2, admin_notes),
        verified_by = $3,
        verified_at = CURRENT_TIMESTAMP,
        expiry_date = COALESCE($4, expiry_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      verificationResult ? JSON.stringify(verificationResult) : null,
      adminNotes,
      session.user.id,
      calculatedExpiryDate,
      certificationId
    ])

    logger.info('Certification verified', {
      certificationId,
      adminId: session.user.id,
      applicationId: certification.application_id,
      userId: certification.user_id,
      calculatedExpiryDate
    })

    return apiSuccess({
      message: 'Zertifizierung erfolgreich verifiziert',
      certificationId,
      expiryDate: calculatedExpiryDate
    })

  } catch (error) {
    logger.error('Error verifying certification', { error, certificationId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}