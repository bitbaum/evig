import { NextRequest } from 'next/server'
import { db } from '@/db'
import { donations, users } from '@/db/schema'
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { CreateDonationSchema, GetDonationsQuerySchema } from '@/lib/schemas/donations'
import { logger } from '@/lib/logger'
import { DONATION_TYPES, getEstimatedValue } from '@/config/donations'
import { alias } from 'drizzle-orm/pg-core'

const recorder = alias(users, 'recorder')

/**
 * GET /api/admin/donations
 * List all donations with filtering and pagination
 */
export const GET = withAdmin('donations', async (request: NextRequest, session) => {
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

    // Build dynamic filters
    const conditions: SQL[] = []
    if (filters.donation_type) conditions.push(eq(donations.donationType, filters.donation_type))
    if (filters.status) conditions.push(eq(donations.status, filters.status))
    if (filters.user_id) conditions.push(eq(donations.userId, filters.user_id))
    if (filters.from_date) conditions.push(gte(donations.createdAt, filters.from_date))
    if (filters.to_date) conditions.push(lte(donations.createdAt, filters.to_date))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Determine sort
    const sortColumnMap: Record<string, SQL> = {
      created_at: sql`${donations.createdAt}`,
      amount_cents: sql`${donations.amountCents}`,
      status: sql`${donations.status}`,
    }
    const sortCol = sortColumnMap[filters.sort_by] || sql`${donations.createdAt}`
    const orderBy = filters.sort_order === 'asc' ? asc(sortCol) : desc(sortCol)

    // Single query with COUNT(*) OVER() for pagination
    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: donations.id,
        user_id: donations.userId,
        user_name: users.name,
        user_email: users.email,
        donation_type: donations.donationType,
        amount_cents: donations.amountCents,
        currency: donations.currency,
        payment_method: donations.paymentMethod,
        payment_reference: donations.paymentReference,
        payment_date: donations.paymentDate,
        is_recurring: donations.isRecurring,
        recurring_frequency: donations.recurringFrequency,
        device_category: donations.deviceCategory,
        device_description: donations.deviceDescription,
        device_brand: donations.deviceBrand,
        device_model: donations.deviceModel,
        device_condition: donations.deviceCondition,
        device_age_years: donations.deviceAgeYears,
        estimated_value_cents: donations.estimatedValueCents,
        donor_name: donations.donorName,
        donor_email: donations.donorEmail,
        donor_address: donations.donorAddress,
        status: donations.status,
        recorded_by: donations.recordedBy,
        recorded_by_name: recorder.name,
        receipt_requested: donations.receiptRequested,
        receipt_sent: donations.receiptSent,
        receipt_sent_at: donations.receiptSentAt,
        thank_you_sent: donations.thankYouSent,
        thank_you_sent_at: donations.thankYouSentAt,
        notes: donations.notes,
        created_at: donations.createdAt,
        updated_at: donations.updatedAt,
      })
      .from(donations)
      .leftJoin(users, eq(donations.userId, users.id))
      .leftJoin(recorder, eq(donations.recordedBy, recorder.id))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(filters.offset)

    const total = rows[0]?._total ?? 0;
    const items = rows.map(({ _total, ...rest }) => rest);

    return apiSuccess({
      items,
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
export const POST = withAdmin('donations', async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const parsed = CreateDonationSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest('Ungültige Spendedaten', parsed.error.flatten().fieldErrors)
    }

    const data = parsed.data

    if (data.donation_type === DONATION_TYPES.MONETARY) {
      const [created] = await db
        .insert(donations)
        .values({
          donationType: data.donation_type,
          amountCents: data.amount_cents,
          currency: data.currency,
          paymentMethod: data.payment_method || null,
          paymentReference: data.payment_reference || null,
          paymentDate: data.payment_date || null,
          isRecurring: data.is_recurring,
          recurringFrequency: data.recurring_frequency || null,
          userId: data.user_id || null,
          donorName: data.donor_name || null,
          donorEmail: data.donor_email || null,
          donorAddress: data.donor_address || null,
          receiptRequested: data.receipt_requested,
          notes: data.notes || null,
          status: 'recorded',
          recordedBy: session.user.id,
        })
        .returning({ id: donations.id })

      logger.info('Monetary donation created', { donationId: created.id, recordedBy: session.user.id })
      return apiSuccess({ id: created.id }, 201)
    }

    // Device donation
    const estimatedValue = data.estimated_value_cents ?? getEstimatedValue(data.device_category)

    const [created] = await db
      .insert(donations)
      .values({
        donationType: data.donation_type,
        deviceCategory: data.device_category,
        deviceDescription: data.device_description || null,
        deviceBrand: data.device_brand || null,
        deviceModel: data.device_model || null,
        deviceCondition: data.device_condition || null,
        deviceAgeYears: data.device_age_years || null,
        estimatedValueCents: estimatedValue,
        userId: data.user_id || null,
        donorName: data.donor_name || null,
        donorEmail: data.donor_email || null,
        donorAddress: data.donor_address || null,
        receiptRequested: data.receipt_requested,
        notes: data.notes || null,
        status: 'recorded',
        recordedBy: session.user.id,
      })
      .returning({ id: donations.id })

    logger.info('Device donation created', {
      donationId: created.id,
      category: data.device_category,
      recordedBy: session.user.id,
    })

    return apiSuccess({ id: created.id }, 201)

  } catch (error) {
    logger.error('Failed to create donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
