import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { CERTIFICATION_STATUS } from '@/config/certification-status'
import { logger } from '@/lib/logger'
import { validateBody, CertificationVerifySchema } from '@/lib/schemas'

interface CertificationRow {
  id: string
  application_id: string
  user_id: string
  verification_status: string
  expiry_date: string | null
  validity_period_months: number | null
  issue_date: string | null
}

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: certificationId } = context!.params!
  try {
    const body = await request.json()
    const validation = validateBody(CertificationVerifySchema, body)
    if (!validation.success) return validation.error
    const { adminNotes, verificationResult } = validation.data

    // Get certification details
    const certificationResult = await db.execute(sql`
      SELECT rc.*, ra.user_id, ct.validity_period_months
      FROM ${sql.raw(TABLE_NAMES.REPAIRER_CERTIFICATIONS)} rc
      JOIN ${sql.raw(TABLE_NAMES.REPAIRER_APPLICATIONS)} ra ON rc.application_id = ra.id
      LEFT JOIN ${sql.raw(TABLE_NAMES.CERTIFICATION_TYPES)} ct ON rc.certification_type_id = ct.id
      WHERE rc.id = ${certificationId}
    `)

    if (certificationResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.CERTIFICATION_NOT_FOUND)
    }

    const certification = certificationResult.rows[0] as unknown as CertificationRow

    if (certification.verification_status === CERTIFICATION_STATUS.VERIFIED) {
      return apiBadRequest(ERROR_MESSAGES.CERTIFICATION_ALREADY_VERIFIED)
    }

    // Calculate expiry date if certification type has validity period and no expiry date is set.
    //
    // Previously approximated months as 30 days each, which drifts the
    // expiry date earlier by ~5 days/year (5–6 days for 12-month certs,
    // 10–12 for 24-month, 15+ for 36-month). Use Date#setMonth so
    // "1 year later" actually lands on the same calendar day. Edge case:
    // Jan 31 + 1 month overflows to early March via JS's standard
    // setMonth semantics, which matches the legal "same day N months
    // later" expectation for cert expiry.
    let calculatedExpiryDate = certification.expiry_date
    if (!calculatedExpiryDate && certification.validity_period_months && certification.issue_date) {
      const expiryDate = new Date(certification.issue_date)
      expiryDate.setMonth(expiryDate.getMonth() + certification.validity_period_months)
      calculatedExpiryDate = expiryDate.toISOString()
    }

    // Update certification verification status
    const verificationResultJson = verificationResult ? JSON.stringify(verificationResult) : null
    await db.execute(sql`
      UPDATE ${sql.raw(TABLE_NAMES.REPAIRER_CERTIFICATIONS)}
      SET
        verification_status = ${CERTIFICATION_STATUS.VERIFIED},
        verification_result = COALESCE(${verificationResultJson}, verification_result),
        admin_notes = COALESCE(${adminNotes}, admin_notes),
        verified_by = ${session.user.id},
        verified_at = CURRENT_TIMESTAMP,
        expiry_date = COALESCE(${calculatedExpiryDate}, expiry_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${certificationId}
    `)

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
    logger.error('Error verifying certification', { error, certificationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
