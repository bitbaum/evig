import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { validateBody, RepairerApplicationSchema } from '@/lib/schemas'

interface ApplicationRow {
  id: string
  status: string
}

interface ApplicationCreatedRow {
  id: string
  created_at: string
}

interface AdminRow {
  id: string
  name: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const formData = await request.formData()

    // Convert FormData to plain object for Zod validation
    const formDataObj = {
      businessType: formData.get('businessType') as string,
      businessName: formData.get('businessName') as string || null,
      description: formData.get('description') as string,
      yearsExperience: formData.get('yearsExperience') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string || null,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      postalCode: formData.get('postalCode') as string,
      serviceRadius: formData.get('serviceRadius') as string,
      remoteServices: formData.get('remoteServices') as string,
      hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null,
      emergencyFee: formData.get('emergencyFee') ? parseFloat(formData.get('emergencyFee') as string) : null,
      homeVisitFee: formData.get('homeVisitFee') ? parseFloat(formData.get('homeVisitFee') as string) : null,
      servicesOffered: JSON.parse(formData.get('servicesOffered') as string || '[]'),
      specializations: JSON.parse(formData.get('specializations') as string || '[]'),
      certifications: JSON.parse(formData.get('certifications') as string || '[]'),
      insuranceInfo: formData.get('insuranceInfo') as string || null,
      termsAccepted: formData.get('termsAccepted') === 'true' ? true as const : false,
    }

    const validation = validateBody(RepairerApplicationSchema, formDataObj)
    if (!validation.success) return validation.error

    const {
      businessType, businessName, description, yearsExperience,
      phone, website, address, city, postalCode, serviceRadius,
      remoteServices, hourlyRate, emergencyFee, homeVisitFee,
      servicesOffered, specializations, certifications, insuranceInfo,
      termsAccepted
    } = validation.data

    // Check if user already has a repairer profile or application
    const existingProfile = await query(
      `SELECT id FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE user_id = $1`,
      [session.user.id]
    )

    if (existingProfile.rows.length > 0) {
      return apiBadRequest('Sie haben bereits ein Reparateur-Profil')
    }

    const existingApplication = await query(
      `SELECT id, status FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE user_id = $1`,
      [session.user.id]
    )

    if (existingApplication.rows.length > 0) {
      const app = existingApplication.rows[0] as ApplicationRow
      if (app.status === 'approved') {
        return apiBadRequest('Ihr Profil wurde bereits freigeschaltet')
      }
      if (app.status === 'pending') {
        return apiBadRequest(ERROR_MESSAGES.PENDING_APPLICATION)
      }
    }

    // Handle file uploads (simplified - in production, you'd upload to cloud storage)
    const portfolioImages: string[] = []
    const certificationDocs: string[] = []
    let idDocument: string | null = null

    // Process uploaded files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('portfolioImage_') && value instanceof File) {
        // In production, upload to cloud storage and get URL
        portfolioImages.push(`/uploads/portfolio/${value.name}`)
      } else if (key.startsWith('certificationDoc_') && value instanceof File) {
        certificationDocs.push(`/uploads/certifications/${value.name}`)
      } else if (key === 'idDocument' && value instanceof File) {
        idDocument = `/uploads/id/${value.name}`
      }
    }

    // Create repairer application
    const applicationResult = await query(`
      INSERT INTO ${TABLE_NAMES.REPAIRER_APPLICATIONS} (
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
        terms_accepted,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, 'pending'
      )
      RETURNING id
    `, [
      session.user.id,
      businessName || null,
      businessType,
      description,
      yearsExperience,
      phone,
      website || null,
      address,
      city,
      postalCode,
      serviceRadius,
      remoteServices,
      hourlyRate ? Math.round(hourlyRate * 100) : null,
      emergencyFee ? Math.round(emergencyFee * 100) : null,
      homeVisitFee ? Math.round(homeVisitFee * 100) : null,
      servicesOffered,
      specializations,
      certifications,
      insuranceInfo || null,
      portfolioImages,
      certificationDocs,
      termsAccepted
    ])

    const createdApplication = applicationResult.rows[0] as ApplicationCreatedRow

    // Send confirmation email to applicant
    const applicantEmailResult = await sendEmail(
      formData.get('email') as string || session.user.email || '',
      'repairerApplicationSubmitted',
      session.user.name || 'Reparateur-Bewerber',
      createdApplication.id
    )

    if (!applicantEmailResult.success) {
      logger.warn('Failed to send repairer application confirmation email to applicant', {
        applicationId: createdApplication.id,
        error: applicantEmailResult.error
      })
    }

    // Send notification email to admins (staff users)
    try {
      // Get all admin emails (staff users)
      const adminEmailsResult = await query(
        `SELECT email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true AND email IS NOT NULL`,
        []
      )

      const adminDashboardUrl = `${APP_URL}/admin/repairer-applications`

      for (const admin of adminEmailsResult.rows as AdminRow[]) {
        const adminEmailResult = await sendEmail(
          admin.email,
          'adminNewRepairerApplication',
          session.user.name || 'Unbekannter Bewerber',
          session.user.email || 'unbekannt@example.com',
          adminDashboardUrl
        )

        if (!adminEmailResult.success) {
          logger.warn('Failed to send new repairer application notification to admin', {
            adminEmail: admin.email,
            applicationId: createdApplication.id,
            error: adminEmailResult.error
          })
        }
      }
    } catch (error) {
      logger.error('Error sending admin notifications for new repairer application', {
        applicationId: createdApplication.id,
        error
      })
    }

    return apiSuccess({
      message: SUCCESS_MESSAGES.REPAIRER_APPLICATION_SUBMITTED,
      applicationId: createdApplication.id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}