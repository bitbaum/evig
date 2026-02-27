import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { CountRow } from '@/lib/api/db-types'

interface ApplicationRow {
  id: string
  user_id: string
  applicant_name: string
  applicant_email: string
  user_created_at: string
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
  certifications: unknown
  insurance_info: unknown
  portfolio_images: string[]
  verification_documents: unknown
  terms_accepted: boolean
  status: string
  document_verification_status: string
  admin_notes: string
  reviewed_by: string
  reviewed_at: string
  created_at: string
  updated_at: string
}

export const GET = withAdmin(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate status parameter
    const validStatuses = ['pending', 'approved', 'rejected', 'requires_changes']
    if (!validStatuses.includes(status)) {
      return apiBadRequest('Ungültiger Status-Filter')
    }

    // Get repairer applications with user details
    const applicationsResult = await query(`
      SELECT
        ra.*,
        u.name as applicant_name,
        u.email as applicant_email,
        u.created_at as user_created_at,
        COALESCE(ra.document_verification_status, 'pending') as document_verification_status,
        CASE
          WHEN ra.status = 'pending' THEN 1
          WHEN ra.status = 'requires_changes' THEN 2
          WHEN ra.status = 'approved' THEN 3
          WHEN ra.status = 'rejected' THEN 4
        END as priority_order
      FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra
      JOIN ${TABLE_NAMES.USERS} u ON ra.user_id = u.id
      WHERE ra.status = $1
      ORDER BY priority_order ASC, ra.created_at ASC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset])

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE status = $1`,
      [status]
    )

    const applications = (applicationsResult.rows as ApplicationRow[]).map(app => ({
      id: app.id,
      userId: app.user_id,
      applicantName: app.applicant_name,
      applicantEmail: app.applicant_email,
      userCreatedAt: app.user_created_at,
      businessName: app.business_name,
      businessType: app.business_type,
      description: app.description,
      yearsExperience: app.years_experience,
      phone: app.phone,
      website: app.website,
      address: app.address,
      city: app.city,
      postalCode: app.postal_code,
      serviceRadiusKm: app.service_radius_km,
      remoteServices: app.remote_services,
      hourlyRateCents: app.hourly_rate_cents,
      emergencyFeeCents: app.emergency_fee_cents,
      homeVisitFeeCents: app.home_visit_fee_cents,
      servicesOffered: app.services_offered,
      specializations: app.specializations,
      certifications: app.certifications,
      insuranceInfo: app.insurance_info,
      portfolioImages: app.portfolio_images,
      verificationDocuments: app.verification_documents,
      termsAccepted: app.terms_accepted,
      status: app.status,
      documentVerificationStatus: app.document_verification_status,
      adminNotes: app.admin_notes,
      reviewedBy: app.reviewed_by,
      reviewedAt: app.reviewed_at,
      createdAt: app.created_at,
      updatedAt: app.updated_at
    }))

    logger.info('Admin fetched repairer applications', {
      adminId: session.user.id,
      status,
      count: applications.length
    })

    const count = countResult.rows[0] as CountRow
    return apiSuccess({
      applications,
      total: parseInt(count.total),
      status,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < parseInt(count.total)
      }
    })

  } catch (error) {
    logger.error('Error fetching repairer applications', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})