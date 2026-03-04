import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { ROLES } from '@/lib/constants'
import { APP_URL } from '@/config/urls'

interface ExistsRow {
  exists: boolean
}

interface ApplicationRow {
  user_id: string
  email: string
  name: string
  status: string
  business_name: string
  business_type: string
  description: string
  years_experience: number
  phone: string
  website: string
  address: string
  city: string
  postal_code: string
  service_radius_km: number
  remote_services: boolean
  hourly_rate_cents: number
  emergency_fee_cents: number
  home_visit_fee_cents: number
  services_offered: string[]
  specializations: string[]
  insurance_info: unknown
  portfolio_images: string[]
}

interface CertificationRow {
  name: string
  issuing_authority: string
  certification_number: string
  issue_date: string
  expiry_date: string
  category: string
}

interface DocumentRow {
  file_path: string
  original_filename: string
  document_type: string
}

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: applicationId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes } = body

    // Validate admin notes if provided
    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get application details
    const applicationResult = await query(`
      SELECT ra.*, u.email, u.name
      FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra
      JOIN ${TABLE_NAMES.USERS} u ON ra.user_id = u.id
      WHERE ra.id = $1
    `, [applicationId])

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    const application = applicationResult.rows[0] as ApplicationRow

    if (application.status === 'approved') {
      return apiBadRequest('Diese Bewerbung wurde bereits genehmigt')
    }

    // Start transaction to update application and user role
    await query('BEGIN')

    try {
      // Update application status
      await query(`
        UPDATE ${TABLE_NAMES.REPAIRER_APPLICATIONS}
        SET
          status = 'approved',
          admin_notes = COALESCE($1, admin_notes),
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [adminNotes, session.user.id, applicationId])

      // Update user role to repairer
      await query(`
        UPDATE ${TABLE_NAMES.USERS}
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [ROLES.REPAIRER, application.user_id])

      // Check if repairer_profiles table exists and create profile if needed
      const profileTableExists = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [TABLE_NAMES.REPAIRER_PROFILES])

      const exists = (profileTableExists.rows[0] as ExistsRow).exists
      if (exists) {
        // Get verified certifications for the profile
        const verifiedCertifications = await query(`
          SELECT
            COALESCE(ct.name, rc.custom_name) as name,
            rc.issuing_authority,
            rc.certification_number,
            rc.issue_date,
            rc.expiry_date,
            ct.category
          FROM ${TABLE_NAMES.REPAIRER_CERTIFICATIONS} rc
          LEFT JOIN ${TABLE_NAMES.CERTIFICATION_TYPES} ct ON rc.certification_type_id = ct.id
          WHERE rc.application_id = $1 AND rc.verification_status = 'verified'
        `, [applicationId])

        // Get verified documents for the profile
        const verifiedDocuments = await query(`
          SELECT file_path, original_filename, dt.name as document_type
          FROM ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd
          LEFT JOIN ${TABLE_NAMES.DOCUMENT_TYPES} dt ON vd.document_type_id = dt.id
          WHERE vd.application_id = $1 AND vd.status = 'approved'
        `, [applicationId])

        const certificationsData = (verifiedCertifications.rows as CertificationRow[]).map(cert => ({
          name: cert.name,
          authority: cert.issuing_authority,
          number: cert.certification_number,
          issueDate: cert.issue_date,
          expiryDate: cert.expiry_date,
          category: cert.category,
          verified: true
        }))

        const documentsData = (verifiedDocuments.rows as DocumentRow[]).map(doc => ({
          type: doc.document_type,
          filename: doc.original_filename,
          path: doc.file_path,
          verified: true
        }))

        // Create or update repairer profile with verified data
        await query(`
          INSERT INTO ${TABLE_NAMES.REPAIRER_PROFILES} (
            user_id,
            business_name,
            business_type,
            description,
            years_experience,
            phone,
            website,
            address,
            city,
            postal_code,
            service_radius_km,
            remote_services,
            hourly_rate_cents,
            emergency_fee_cents,
            home_visit_fee_cents,
            services_offered,
            specializations,
            certifications,
            insurance_info,
            portfolio_images,
            verification_documents,
            is_verified,
            verified_at,
            verified_by,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, true, CURRENT_TIMESTAMP, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT (user_id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            business_type = EXCLUDED.business_type,
            description = EXCLUDED.description,
            years_experience = EXCLUDED.years_experience,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            postal_code = EXCLUDED.postal_code,
            service_radius_km = EXCLUDED.service_radius_km,
            remote_services = EXCLUDED.remote_services,
            hourly_rate_cents = EXCLUDED.hourly_rate_cents,
            emergency_fee_cents = EXCLUDED.emergency_fee_cents,
            home_visit_fee_cents = EXCLUDED.home_visit_fee_cents,
            services_offered = EXCLUDED.services_offered,
            specializations = EXCLUDED.specializations,
            certifications = EXCLUDED.certifications,
            insurance_info = EXCLUDED.insurance_info,
            portfolio_images = EXCLUDED.portfolio_images,
            verification_documents = EXCLUDED.verification_documents,
            is_verified = true,
            verified_at = CURRENT_TIMESTAMP,
            verified_by = EXCLUDED.verified_by,
            updated_at = CURRENT_TIMESTAMP
        `, [
          application.user_id,
          application.business_name,
          application.business_type,
          application.description,
          application.years_experience,
          application.phone,
          application.website,
          application.address,
          application.city,
          application.postal_code,
          application.service_radius_km,
          application.remote_services,
          application.hourly_rate_cents,
          application.emergency_fee_cents,
          application.home_visit_fee_cents,
          application.services_offered,
          application.specializations,
          JSON.stringify(certificationsData), // Store verified certifications
          application.insurance_info,
          application.portfolio_images,
          JSON.stringify(documentsData), // Store verified documents
          session.user.id
        ])
      }

      await query('COMMIT')

      logger.info('Repairer application approved', {
        applicationId,
        adminId: session.user.id,
        userId: application.user_id,
        applicantEmail: application.email
      })

      // Send approval notification email to applicant
      const dashboardUrl = `${APP_URL}/dashboard/repairer`
      const approvalEmailResult = await sendEmail(
        application.email,
        'repairerApplicationApproved',
        application.name || 'Reparateur',
        dashboardUrl
      )

      if (!approvalEmailResult.success) {
        logger.warn('Failed to send repairer application approval email', {
          applicationId,
          applicantEmail: application.email,
          error: approvalEmailResult.error
        })
      }

      return apiSuccess({
        message: 'Reparateur-Bewerbung erfolgreich genehmigt',
        applicationId
      })

    } catch (error) {
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    logger.error('Error approving repairer application', { error, applicationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})