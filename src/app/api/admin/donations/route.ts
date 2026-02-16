import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CreateDonationSchema, GetDonationsQuerySchema } from '@/lib/schemas/donations'
import { logger } from '@/lib/logger'
import { DONATION_TYPES, getEstimatedValue } from '@/config/donations'

interface DonationRow {
  id: string
  user_id: string | null
  donation_type: string
  // Monetary
  amount_cents: number | null
  currency: string
  payment_method: string | null
  payment_reference: string | null
  payment_date: Date | null
  is_recurring: boolean
  recurring_frequency: string | null
  // Device
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  device_age_years: number | null
  estimated_value_cents: number | null
  // Anonymous donor
  donor_name: string | null
  donor_email: string | null
  donor_address: string | null
  // Status
  status: string
  recorded_by: string | null
  receipt_requested: boolean
  receipt_sent: boolean
  receipt_sent_at: Date | null
  thank_you_sent: boolean
  thank_you_sent_at: Date | null
  notes: string | null
  // Timestamps
  created_at: Date
  updated_at: Date
  // Joined fields
  user_name: string | null
  user_email: string | null
  recorded_by_name: string | null
}

interface CountRow {
  count: string
}

/**
 * GET /api/admin/donations
 * List all donations with filtering and pagination
 */
export const GET = withAdmin(async (request: NextRequest, session) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryParsed = GetDonationsQuerySchema.safeParse({
      donation_type: searchParams.get('donation_type') || undefined,
      status: searchParams.get('status') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      limit: searchParams.get('limit') || 20,
      offset: searchParams.get('offset') || 0,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
    })

    if (!queryParsed.success) {
      return apiBadRequest('Ungültige Abfrageparameter', queryParsed.error.flatten().fieldErrors)
    }

    const filters = queryParsed.data
    const conditions: string[] = []
    const params: (string | number | Date)[] = []
    let paramIndex = 1

    if (filters.donation_type) {
      conditions.push(`d.donation_type = $${paramIndex++}`)
      params.push(filters.donation_type)
    }

    if (filters.status) {
      conditions.push(`d.status = $${paramIndex++}`)
      params.push(filters.status)
    }

    if (filters.user_id) {
      conditions.push(`d.user_id = $${paramIndex++}`)
      params.push(filters.user_id)
    }

    if (filters.from_date) {
      conditions.push(`d.created_at >= $${paramIndex++}`)
      params.push(filters.from_date)
    }

    if (filters.to_date) {
      conditions.push(`d.created_at <= $${paramIndex++}`)
      params.push(filters.to_date)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validate sort column to prevent injection
    const allowedSortColumns = ['created_at', 'amount_cents', 'status']
    const sortBy = allowedSortColumns.includes(filters.sort_by) ? filters.sort_by : 'created_at'
    const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC'

    // Count total
    const countResult = await query<CountRow>(`
      SELECT COUNT(*) as count FROM ${TABLE_NAMES.DONATIONS} d ${whereClause}
    `, params)
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    // Fetch with pagination
    const donations = await query<DonationRow>(`
      SELECT
        d.*,
        u.name as user_name,
        u.email as user_email,
        recorder.name as recorded_by_name
      FROM ${TABLE_NAMES.DONATIONS} d
      LEFT JOIN ${TABLE_NAMES.USERS} u ON d.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USERS} recorder ON d.recorded_by = recorder.id
      ${whereClause}
      ORDER BY d.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, filters.limit, filters.offset])

    return apiSuccess({
      items: donations.rows.map(d => ({
        id: d.id,
        user_id: d.user_id,
        user_name: d.user_name,
        user_email: d.user_email,
        donation_type: d.donation_type,
        // Monetary
        amount_cents: d.amount_cents,
        currency: d.currency,
        payment_method: d.payment_method,
        payment_reference: d.payment_reference,
        payment_date: d.payment_date?.toISOString(),
        is_recurring: d.is_recurring,
        recurring_frequency: d.recurring_frequency,
        // Device
        device_category: d.device_category,
        device_description: d.device_description,
        device_brand: d.device_brand,
        device_model: d.device_model,
        device_condition: d.device_condition,
        device_age_years: d.device_age_years,
        estimated_value_cents: d.estimated_value_cents,
        // Anonymous
        donor_name: d.donor_name,
        donor_email: d.donor_email,
        donor_address: d.donor_address,
        // Status
        status: d.status,
        recorded_by: d.recorded_by,
        recorded_by_name: d.recorded_by_name,
        receipt_requested: d.receipt_requested,
        receipt_sent: d.receipt_sent,
        receipt_sent_at: d.receipt_sent_at?.toISOString(),
        thank_you_sent: d.thank_you_sent,
        thank_you_sent_at: d.thank_you_sent_at?.toISOString(),
        notes: d.notes,
        // Timestamps
        created_at: d.created_at.toISOString(),
        updated_at: d.updated_at.toISOString(),
      })),
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
    })

  } catch (error) {
    logger.error('Failed to fetch donations', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * POST /api/admin/donations
 * Create a new donation (monetary or device)
 */
export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const parsed = CreateDonationSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest('Ungültige Spendedaten', parsed.error.flatten().fieldErrors)
    }

    const data = parsed.data

    // Build insert query based on donation type
    if (data.donation_type === DONATION_TYPES.MONETARY) {
      const result = await query<{ id: string }>(`
        INSERT INTO ${TABLE_NAMES.DONATIONS} (
          donation_type,
          amount_cents,
          currency,
          payment_method,
          payment_reference,
          payment_date,
          is_recurring,
          recurring_frequency,
          user_id,
          donor_name,
          donor_email,
          donor_address,
          receipt_requested,
          notes,
          status,
          recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `, [
        data.donation_type,
        data.amount_cents,
        data.currency,
        data.payment_method || null,
        data.payment_reference || null,
        data.payment_date || null,
        data.is_recurring,
        data.recurring_frequency || null,
        data.user_id || null,
        data.donor_name || null,
        data.donor_email || null,
        data.donor_address || null,
        data.receipt_requested,
        data.notes || null,
        'recorded',
        session.user.id,
      ])

      logger.info('Monetary donation created', { donationId: result.rows[0].id, recordedBy: session.user.id })

      return apiSuccess({ id: result.rows[0].id }, 201)
    }

    // Device donation
    const estimatedValue = data.estimated_value_cents ?? getEstimatedValue(data.device_category)

    const result = await query<{ id: string }>(`
      INSERT INTO ${TABLE_NAMES.DONATIONS} (
        donation_type,
        device_category,
        device_description,
        device_brand,
        device_model,
        device_condition,
        device_age_years,
        estimated_value_cents,
        user_id,
        donor_name,
        donor_email,
        donor_address,
        receipt_requested,
        notes,
        status,
        recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      data.donation_type,
      data.device_category,
      data.device_description || null,
      data.device_brand || null,
      data.device_model || null,
      data.device_condition || null,
      data.device_age_years || null,
      estimatedValue,
      data.user_id || null,
      data.donor_name || null,
      data.donor_email || null,
      data.donor_address || null,
      data.receipt_requested,
      data.notes || null,
      'recorded',
      session.user.id,
    ])

    logger.info('Device donation created', {
      donationId: result.rows[0].id,
      category: data.device_category,
      recordedBy: session.user.id,
    })

    return apiSuccess({ id: result.rows[0].id }, 201)

  } catch (error) {
    logger.error('Failed to create donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
