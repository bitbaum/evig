import { NextRequest } from 'next/server'
import { db } from '@/db'
import { donations, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { UpdateDonationSchema } from '@/lib/schemas/donations'
import { DONATION_STATUSES } from '@/config/donations'
import { logger } from '@/lib/logger'

const recorder = alias(users, 'recorder')

/**
 * GET /api/admin/donations/[id]
 * Get a single donation by ID
 */
export const GET = withAdmin<{ id: string }>('donations', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const [d] = await db
      .select({
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
      .where(eq(donations.id, id))

    if (!d) {
      return apiNotFound('Spende')
    }

    return apiSuccess(d)

  } catch (error) {
    logger.error('Failed to fetch donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * PATCH /api/admin/donations/[id]
 * Update a donation (status, notes, receipt_sent, etc.)
 */
export const PATCH = withAdmin<{ id: string }>('donations', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const parsed = UpdateDonationSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest('Ungültige Daten', parsed.error.flatten().fieldErrors)
    }

    // Check donation exists
    const [existing] = await db
      .select({ id: donations.id })
      .from(donations)
      .where(eq(donations.id, id))

    if (!existing) {
      return apiNotFound('Spende')
    }

    const data = parsed.data
    const update: Record<string, unknown> = {}

    if (data.status !== undefined) update.status = data.status
    if (data.notes !== undefined) update.notes = data.notes
    if (data.estimated_value_cents !== undefined) update.estimatedValueCents = data.estimated_value_cents
    if (data.user_id !== undefined) update.userId = data.user_id

    if (data.thank_you_sent !== undefined) {
      update.thankYouSent = data.thank_you_sent
      if (data.thank_you_sent) update.thankYouSentAt = sql`NOW()`
    }

    if (data.receipt_sent !== undefined) {
      update.receiptSent = data.receipt_sent
      if (data.receipt_sent) update.receiptSentAt = sql`NOW()`
    }

    if (Object.keys(update).length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    await db
      .update(donations)
      .set(update)
      .where(eq(donations.id, id))

    logger.info('Donation updated', { donationId: id, updatedBy: session.user.id, fields: Object.keys(data) })

    return apiSuccess({ id, updated: true })

  } catch (error) {
    logger.error('Failed to update donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * DELETE /api/admin/donations/[id]
 * Soft-delete a donation (marks as archived)
 */
export const DELETE = withAdmin<{ id: string }>('donations', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check donation exists
    const [existing] = await db
      .select({ id: donations.id })
      .from(donations)
      .where(eq(donations.id, id))

    if (!existing) {
      return apiNotFound('Spende')
    }

    // Soft delete by setting status to 'archived'
    await db
      .update(donations)
      .set({
        status: DONATION_STATUSES.ARCHIVED,
        notes: sql`COALESCE(${donations.notes}, '') || ${` [Archiviert am ${new Date().toISOString()} durch ${session.user.email}]`}`,
      })
      .where(eq(donations.id, id))

    logger.info('Donation archived', { donationId: id, archivedBy: session.user.id })

    return apiSuccess({ id, deleted: true })

  } catch (error) {
    logger.error('Failed to delete donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
