import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is admin
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return apiUnauthorized('Nur Administratoren können diese Funktion verwenden')
    }

    const applicationId = params.id
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
      JOIN users u ON ra.user_id = u.id
      WHERE ra.id = $1
    `, [applicationId])

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    const application = applicationResult.rows[0]

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
        UPDATE users
        SET role = 'repairer', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [application.user_id])

      // Check if repairer_profiles table exists and create profile if needed
      const profileTableExists = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = '${TABLE_NAMES.REPAIRER_PROFILES}'
        )
      `)

      if (profileTableExists.rows[0].exists) {
        // Get verified certifications for the profile
        const verifiedCertifications = await query(`
          SELECT
            COALESCE(ct.name, rc.custom_name) as name,
            rc.issuing_authority,
            rc.certification_number,
            rc.issue_date,
            rc.expiry_date,
            ct.category
          FROM repairer_certifications rc
          LEFT JOIN certification_types ct ON rc.certification_type_id = ct.id
          WHERE rc.application_id = $1 AND rc.verification_status = 'verified'
        `, [applicationId])

        // Get verified documents for the profile
        const verifiedDocuments = await query(`
          SELECT file_path, original_filename, dt.name as document_type
          FROM verification_documents vd
          LEFT JOIN document_types dt ON vd.document_type_id = dt.id
          WHERE vd.application_id = $1 AND vd.status = 'approved'
        `, [applicationId])

        const certificationsData = verifiedCertifications.rows.map(cert => ({
          name: cert.name,
          authority: cert.issuing_authority,
          number: cert.certification_number,
          issueDate: cert.issue_date,
          expiryDate: cert.expiry_date,
          category: cert.category,
          verified: true
        }))

        const documentsData = verifiedDocuments.rows.map(doc => ({
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
      const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/repairer`
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
    logger.error('Error approving repairer application', { error, applicationId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}