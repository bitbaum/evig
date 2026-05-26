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

    // Check if user already has a repairer application. The userId column
    // has a UNIQUE constraint so there's at most one row per user — but its
    // status determines what re-applying means.
    const existingApplication = await db
      .select({ id: repairerApplications.id, status: repairerApplications.status })
      .from(repairerApplications)
      .where(eq(repairerApplications.userId, session.user.id))

    let existingApplicationId: string | null = null
    if (existingApplication.length > 0) {
      const app = existingApplication[0]
      if (app.status === APPROVAL_STATUS.APPROVED) {
        return apiBadRequest('dein Profil wurde bereits freigeschaltet')
      }
      if (app.status === APPROVAL_STATUS.PENDING) {
        return apiBadRequest(ERROR_MESSAGES.PENDING_APPLICATION)
      }
      // REJECTED or REQUIRES_CHANGES: the user has been told the application
      // didn't pass and is now resubmitting. Reuse the row (UNIQUE(userId)
      // prevents inserting a fresh one anyway) — overwrite the fields with
      // the new submission, reset status to PENDING, clear the admin-side
      // review fields so the next reviewer sees a clean slate.
      existingApplicationId = app.id
    }

    // File uploads (portfolio images, certifications, ID document) are
    // not handled by this route. The previous implementation read
    // `value.name` from FormData and constructed phantom URLs like
    // `/uploads/portfolio/${value.name}` without ever saving the file
    // bytes — so any "uploaded" file ended up as a broken link in the
    // admin reviewer's UI, AND `value.name` is fully user-controlled so
    // an attacker could store path-traversal strings in the DB columns.
    // The legitimate apply form doesn't send these field names; only the
    // dead code path existed.
    //
    // If file upload becomes a requirement, the proper path is to have
    // the client upload via /api/uploads (which actually saves files
    // with MIME / size / extension validation and sharp-based resizing)
    // and then send the returned URLs as JSON fields with the
    // application. Adding raw file handling here without that pipeline
    // re-introduces the same security + correctness gap.
    const portfolioImages: string[] = []
    const certificationDocs: string[] = []

    // Create OR re-submit repairer application. UPDATE when the user has a
    // prior REJECTED / REQUIRES_CHANGES row (captured above), INSERT
    // otherwise. The row's id stays stable across re-submissions so any
    // admin-side links/notifications referencing the application id keep
    // working.
    const applicationFields = {
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
    }

    let createdApplication: { id: string }
    if (existingApplicationId) {
      const [updated] = await db
        .update(repairerApplications)
        .set({
          ...applicationFields,
          // Clear the admin-side review fields so the next reviewer sees a
          // clean slate (not the prior reviewer's notes/decision).
          adminNotes: null,
          reviewedBy: null,
          reviewedAt: null,
        })
        .where(eq(repairerApplications.id, existingApplicationId))
        .returning({ id: repairerApplications.id })
      createdApplication = updated
    } else {
      const [inserted] = await db
        .insert(repairerApplications)
        .values(applicationFields)
        .returning({ id: repairerApplications.id })
      createdApplication = inserted
    }

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

      // Fan out in parallel — sequential awaits would add ~200 ms × N
      // admins to the user's response time.
      const results = await Promise.allSettled(
        adminEmails.map(admin =>
          sendEmail(
            admin.email,
            'adminNewRepairerApplication',
            session.user.name || 'Unbekannter Bewerber',
            session.user.email ?? 'nicht angegeben',
            adminDashboardUrl
          ).then(r => ({ admin, result: r }))
        )
      )

      for (const settled of results) {
        if (settled.status === 'fulfilled' && !settled.value.result.success) {
          logger.warn('Failed to send new repairer application notification to admin', {
            adminEmail: settled.value.admin.email,
            applicationId: createdApplication.id,
            error: settled.value.result.error,
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
