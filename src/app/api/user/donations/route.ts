import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface DonationRow {
  id: string
  donation_type: string
  // Monetary fields
  amount_cents: number | null
  currency: string
  payment_method: string | null
  // Device fields
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  estimated_value_cents: number | null
  // Status
  status: string
  receipt_requested: boolean
  receipt_sent: boolean
  // Timestamps
  created_at: Date | null
}

/**
 * GET /api/user/donations
 * Fetch current user's donation history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Get user's donations ordered by date
    const donations = await query<DonationRow>(`
      SELECT
        id,
        donation_type,
        amount_cents,
        currency,
        payment_method,
        device_category,
        device_description,
        device_brand,
        device_model,
        device_condition,
        estimated_value_cents,
        status,
        receipt_requested,
        receipt_sent,
        created_at
      FROM ${TABLE_NAMES.DONATIONS}
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [session.user.id])

    return apiSuccess(
      donations.rows.map(donation => ({
        id: donation.id,
        donation_type: donation.donation_type,
        // Monetary
        amount_cents: donation.amount_cents,
        currency: donation.currency,
        payment_method: donation.payment_method,
        // Device
        device_category: donation.device_category,
        device_description: donation.device_description,
        device_brand: donation.device_brand,
        device_model: donation.device_model,
        device_condition: donation.device_condition,
        estimated_value_cents: donation.estimated_value_cents,
        // Status
        status: donation.status,
        receipt_requested: donation.receipt_requested,
        receipt_sent: donation.receipt_sent,
        // Dates
        created_at: donation.created_at?.toISOString(),
      }))
    )

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
