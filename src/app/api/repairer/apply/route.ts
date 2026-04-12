import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerApplications, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { validateBody, RepairerApplicationSchema } from '@/lib/schemas'

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
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

    // Check if user already has a repairer application
    const existingApplication = await db
      .select({ id: repairerApplications.id, status: repairerApplications.status })
      .from(repairerApplications)
      .where(eq(repairerApplications.userId, session.user.id))

    if (existingApplication.length > 0) {
      const app = existingApplication[0]
      if (app.status === APPROVAL_STATUS.APPROVED) {
        return apiBadRequest('dein Profil wurde bereits freigeschaltet')
      }
      if (app.status === APPROVAL_STATUS.PENDING) {
        return apiBadRequest(ERROR_MESSAGES.PENDING_APPLICATION)
      }
      // For any other status (rejected, etc.), they already have an application
      return apiBadRequest('Du hast bereits ein Reparateur-Profil')
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
    const [createdApplication] = await db
      .insert(repairerApplications)
      .values({
        userId: session.user.id,
        businessName: businessName || null,
        businessType,
        description,
        yearsExperience,
        phone,
        website: website || null,
        address,
        city,
        postalCode,
        serviceRadiusKm: serviceRadius,
        remoteServices,
        hourlyRateCents: hourlyRate ? Math.round(hourlyRate * 100) : null,
        emergencyFeeCents: emergencyFee ? Math.round(emergencyFee * 100) : null,
        homeVisitFeeCents: homeVisitFee ? Math.round(homeVisitFee * 100) : null,
        servicesOffered,
        specializations,
        certifications,
        insuranceInfo: insuranceInfo || null,
        portfolioImages,
        verificationDocuments: certificationDocs,
        termsAccepted,
        status: APPROVAL_STATUS.PENDING,
      })
      .returning({ id: repairerApplications.id })

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
      const adminEmails = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.isStaff, true))

      const adminDashboardUrl = `${APP_URL}/admin/repairer-applications`

      for (const admin of adminEmails) {
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
})
