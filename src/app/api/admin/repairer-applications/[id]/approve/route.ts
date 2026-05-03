import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { repairerApplications, repairerProfiles, users } from '@/db/schema'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { ROLES } from '@/lib/constants'
import { APP_URL } from '@/config/urls'

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
  certifications: unknown[]
  insurance_info: unknown
  portfolio_images: string[]
  verification_documents: string[]
}

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: applicationId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes } = body

    // Validate admin notes if provided
    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.ADMIN_NOTES_MUST_BE_STRING)
    }

    // Get application details
    const applicationResult = await db.execute(sql`
      SELECT ra.*, u.email, u.name
      FROM ${sql.raw(getTableName(repairerApplications))} ra
      JOIN ${sql.raw(getTableName(users))} u ON ra.user_id = u.id
      WHERE ra.id = ${applicationId}
    `)

    if (applicationResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REPAIRER_APPLICATION_NOT_FOUND)
    }

    const application = applicationResult.rows[0] as unknown as ApplicationRow

    if (application.status === APPROVAL_STATUS.APPROVED) {
      return apiBadRequest('Diese Bewerbung wurde bereits genehmigt')
    }

    // Use Drizzle transaction instead of manual BEGIN/COMMIT/ROLLBACK
    await db.transaction(async (tx) => {
      // Update application status
      await tx.execute(sql`
        UPDATE ${sql.raw(getTableName(repairerApplications))}
        SET
          status = ${APPROVAL_STATUS.APPROVED},
          admin_notes = COALESCE(${adminNotes ?? null}, admin_notes),
          reviewed_by = ${session.user.id},
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${applicationId}
      `)

      // Update user role to repairer
      await tx.execute(sql`
        UPDATE ${sql.raw(getTableName(users))}
        SET role = ${ROLES.REPAIRER}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${application.user_id}
      `)

      // Convert application certifications (jsonb) to text[] for the profile
      const certNames = Array.isArray(application.certifications)
        ? application.certifications.map((c: unknown) =>
            typeof c === 'string' ? c : (c as { name?: string })?.name ?? String(c)
          )
        : []

      // Create or update repairer profile using application data directly
      await tx.execute(sql`
        INSERT INTO ${sql.raw(getTableName(repairerProfiles))} (
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
          verification_date,
          created_at,
          updated_at
        ) VALUES (
          ${application.user_id},
          ${application.business_name},
          ${application.business_type},
          ${application.description},
          ${application.years_experience},
          ${application.phone},
          ${application.website},
          ${application.address},
          ${application.city},
          ${application.postal_code},
          ${application.service_radius_km},
          ${application.remote_services},
          ${application.hourly_rate_cents},
          ${application.emergency_fee_cents},
          ${application.home_visit_fee_cents},
          ${application.services_offered},
          ${application.specializations},
          ${certNames},
          ${application.insurance_info as string},
          ${application.portfolio_images},
          ${application.verification_documents},
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
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
          verification_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `)
    })

    logger.info('Repairer application approved', {
      applicationId,
      adminId: session.user.id,
      userId: application.user_id,
      applicantEmail: application.email
    })

    // Send approval notification email to applicant
    const dashboardUrl = `${APP_URL}/profil/techniker`
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
    logger.error('Error approving repairer application', { error, applicationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
