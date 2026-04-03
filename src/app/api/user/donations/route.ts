import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { donations } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

/**
 * GET /api/user/donations
 * Fetch current user's donation history
 */
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const rows = await db
      .select({
        id: donations.id,
        donation_type: donations.donationType,
        amount_cents: donations.amountCents,
        currency: donations.currency,
        payment_method: donations.paymentMethod,
        device_category: donations.deviceCategory,
        device_description: donations.deviceDescription,
        device_brand: donations.deviceBrand,
        device_model: donations.deviceModel,
        device_condition: donations.deviceCondition,
        estimated_value_cents: donations.estimatedValueCents,
        status: donations.status,
        receipt_requested: donations.receiptRequested,
        receipt_sent: donations.receiptSent,
        created_at: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.userId, session.user.id))
      .orderBy(desc(donations.createdAt))

    return apiSuccess(rows)

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
