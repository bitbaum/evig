import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

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

    // TODO: Send notification email to admins
    // TODO: Send confirmation email to user

    const createdApp = applicationResult.rows[0] as IdRow
    return apiSuccess({
      message: SUCCESS_MESSAGES.SELLER_APPLICATION_SUBMITTED,
      applicationId: createdApp.id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}