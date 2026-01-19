import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { ADMIN_ROLES } from '@/lib/constants'

interface ApplicationRow {
  id: string
  status: string
}

interface IdRow {
  id: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const {
      businessName,
      businessType,
      taxId,
      address,
      city,
      postalCode,
      phone,
      experience,
      productTypes,
      motivation,
      termsAccepted
    } = await request.json()

    // Validate required fields
    if (!address || !city || !postalCode || !phone || !productTypes || productTypes.length === 0 || !termsAccepted) {
      return apiBadRequest(ERROR_MESSAGES.ALL_FIELDS_REQUIRED)
    }

    // Check if user already has a pending or approved application
    const existingApplication = await query(
      `SELECT id, status FROM ${TABLE_NAMES.SELLER_APPLICATIONS} WHERE user_id = $1`,
      [session.user.id]
    )

    if (existingApplication.rows.length > 0) {
      const app = existingApplication.rows[0] as ApplicationRow
      if (app.status === 'approved') {
        return apiBadRequest(ERROR_MESSAGES.ALREADY_APPROVED)
      }
      if (app.status === 'pending') {
        return apiBadRequest(ERROR_MESSAGES.PENDING_APPLICATION)
      }
    }

    // Create seller application
    const applicationResult = await query(`
      INSERT INTO ${TABLE_NAMES.SELLER_APPLICATIONS} (
        user_id,
        business_name,
        business_type,
        tax_id,
        address,
        city,
        postal_code,
        phone,
        experience,
        product_types,
        motivation,
        terms_accepted,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      RETURNING id
    `, [
      session.user.id,
      businessName || null,
      businessType,
      taxId || null,
      address,
      city,
      postalCode,
      phone,
      experience || null,
      productTypes,
      motivation || null,
      termsAccepted
    ])

    const createdApp = applicationResult.rows[0] as IdRow

    // Send confirmation email to user
    try {
      await sendEmail(
        session.user.email || '',
        'sellerApplicationSubmitted',
        session.user.name || 'Verkäufer-Bewerber',
        createdApp.id
      )
    } catch (emailError) {
      logger.warn('Failed to send seller application confirmation email', {
        applicationId: createdApp.id,
        error: emailError
      })
    }

    // Send notification email to admins
    try {
      const adminEmailsResult = await query(
        `SELECT email FROM ${TABLE_NAMES.USERS} WHERE role = ANY($1) AND email IS NOT NULL`,
        [ADMIN_ROLES]
      )
      const adminDashboardUrl = `${APP_URL}/admin/seller-applications`

      for (const admin of adminEmailsResult.rows as { email: string }[]) {
        await sendEmail(
          admin.email,
          'adminNewSellerApplication',
          session.user.name || 'Unbekannter Bewerber',
          session.user.email || 'unbekannt@example.com',
          adminDashboardUrl
        )
      }
    } catch (adminEmailError) {
      logger.warn('Failed to send seller application admin notification', {
        applicationId: createdApp.id,
        error: adminEmailError
      })
    }

    return apiSuccess({
      message: SUCCESS_MESSAGES.SELLER_APPLICATION_SUBMITTED,
      applicationId: createdApp.id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}