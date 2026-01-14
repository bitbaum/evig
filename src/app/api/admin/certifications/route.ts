import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

interface UserRow {
  role: string
}

interface CertificationRow {
  id: string
  application_id: string
  certification_type_id: string
  certification_type_name: string
  certification_type_description: string
  category: string
  custom_name: string
  issuing_authority: string
  default_issuing_authority: string
  certification_number: string
  issue_date: string
  expiry_date: string
  verification_status: string
  verification_method: string
  verification_result: unknown
  admin_notes: string
  verified_by: string
  verified_at: string
  document_path: string
  created_at: string
  updated_at: string
}

interface ApplicationRow {
  id: string
  name: string
  email: string
}

export async function GET(request: NextRequest) {
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

    const user = userResult.rows[0] as UserRow | undefined
    if (!user || !isAdminRole(user.role)) {
      return apiUnauthorized('Nur Administratoren können diese Funktion verwenden')
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const status = searchParams.get('status') || 'pending'

    if (!applicationId) {
      return apiBadRequest('applicationId Parameter ist erforderlich')
    }

    // Validate status parameter
    const validStatuses = ['pending', 'verified', 'rejected', 'expired']
    if (!validStatuses.includes(status)) {
      return apiBadRequest('Ungültiger Status-Filter')
    }

    // Get certifications for this application
    const certificationsResult = await query(`
      SELECT
        rc.*,
        ct.name as certification_type_name,
        ct.description as certification_type_description,
        ct.category,
        ct.issuing_authority as default_issuing_authority,
        ct.validity_period_months,
        ct.requires_verification
      FROM ${TABLE_NAMES.REPAIRER_CERTIFICATIONS} rc
      LEFT JOIN ${TABLE_NAMES.CERTIFICATION_TYPES} ct ON rc.certification_type_id = ct.id
      WHERE rc.application_id = $1 AND rc.verification_status = $2
      ORDER BY rc.created_at ASC
    `, [applicationId, status])

    // Get application details
    const applicationResult = await query(`
      SELECT ra.*, u.name, u.email
      FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra
      JOIN ${TABLE_NAMES.USERS} u ON ra.user_id = u.id
      WHERE ra.id = $1
    `, [applicationId])

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparatur-Bewerbung nicht gefunden')
    }

    const certifications = (certificationsResult.rows as CertificationRow[]).map(cert => ({
      id: cert.id,
      applicationId: cert.application_id,
      certificationTypeId: cert.certification_type_id,
      certificationTypeName: cert.certification_type_name,
      certificationTypeDescription: cert.certification_type_description,
      category: cert.category,
      customName: cert.custom_name,
      issuingAuthority: cert.issuing_authority || cert.default_issuing_authority,
      certificationNumber: cert.certification_number,
      issueDate: cert.issue_date,
      expiryDate: cert.expiry_date,
      verificationStatus: cert.verification_status,
      verificationMethod: cert.verification_method,
      verificationResult: cert.verification_result,
      adminNotes: cert.admin_notes,
      verifiedBy: cert.verified_by,
      verifiedAt: cert.verified_at,
      documentPath: cert.document_path,
      createdAt: cert.created_at,
      updatedAt: cert.updated_at,
      // Computed fields
      isExpired: cert.expiry_date && new Date(cert.expiry_date) < new Date(),
      daysUntilExpiry: cert.expiry_date
        ? Math.ceil((new Date(cert.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    }))

    logger.info('Admin fetched repairer certifications', {
      adminId: session.user.id,
      applicationId,
      status,
      count: certifications.length
    })

    const application = applicationResult.rows[0] as ApplicationRow
    return apiSuccess({
      application: {
        id: application.id,
        applicantName: application.name,
        applicantEmail: application.email
      },
      certifications,
      total: certifications.length
    })

  } catch (error) {
    logger.error('Error fetching repairer certifications', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}