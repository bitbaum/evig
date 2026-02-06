import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection, type StaffUser } from '@/lib/permissions'
import { UpdateDonationSchema } from '@/lib/schemas/donations'
import { logger } from '@/lib/logger'

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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/donations/[id]
 * Get a single donation by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const staffUser: StaffUser = {
      email: session.user.email || '',
      is_staff: session.user.isStaff || false,
      staff_permissions: session.user.staffPermissions || [],
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(staffUser, 'donations')) {
      return apiForbidden('Keine Berechtigung für Spenden')
    }

    const { id } = await params

    const result = await query<DonationRow>(`
      SELECT
        d.*,
        u.name as user_name,
        u.email as user_email,
        recorder.name as recorded_by_name
      FROM ${TABLE_NAMES.DONATIONS} d
      LEFT JOIN ${TABLE_NAMES.USERS} u ON d.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USERS} recorder ON d.recorded_by = recorder.id
      WHERE d.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return apiNotFound('Spende')
    }

    const d = result.rows[0]

    return apiSuccess({
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
    })

  } catch (error) {
    logger.error('Failed to fetch donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * PATCH /api/admin/donations/[id]
 * Update a donation (status, notes, receipt_sent, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const staffUser: StaffUser = {
      email: session.user.email || '',
      is_staff: session.user.isStaff || false,
      staff_permissions: session.user.staffPermissions || [],
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(staffUser, 'donations')) {
      return apiForbidden('Keine Berechtigung für Spenden')
    }

    const { id } = await params
    const body = await request.json()
    const parsed = UpdateDonationSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest('Ungültige Daten', parsed.error.flatten().fieldErrors)
    }

    // Check donation exists
    const existing = await query<{ id: string }>(`
      SELECT id FROM ${TABLE_NAMES.DONATIONS} WHERE id = $1
    `, [id])

    if (existing.rows.length === 0) {
      return apiNotFound('Spende')
    }

    const data = parsed.data
    const updates: string[] = []
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(data.status)
    }

    if (data.thank_you_sent !== undefined) {
      updates.push(`thank_you_sent = $${paramIndex++}`)
      values.push(data.thank_you_sent)
      if (data.thank_you_sent) {
        updates.push(`thank_you_sent_at = NOW()`)
      }
    }

    if (data.receipt_sent !== undefined) {
      updates.push(`receipt_sent = $${paramIndex++}`)
      values.push(data.receipt_sent)
      if (data.receipt_sent) {
        updates.push(`receipt_sent_at = NOW()`)
      }
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(data.notes)
    }

    if (data.estimated_value_cents !== undefined) {
      updates.push(`estimated_value_cents = $${paramIndex++}`)
      values.push(data.estimated_value_cents)
    }

    if (data.user_id !== undefined) {
      updates.push(`user_id = $${paramIndex++}`)
      values.push(data.user_id)
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    values.push(id)

    await query(`
      UPDATE ${TABLE_NAMES.DONATIONS}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values)

    logger.info('Donation updated', { donationId: id, updatedBy: session.user.id, fields: Object.keys(data) })

    return apiSuccess({ id, updated: true })

  } catch (error) {
    logger.error('Failed to update donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * DELETE /api/admin/donations/[id]
 * Soft-delete a donation (marks as archived)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const staffUser: StaffUser = {
      email: session.user.email || '',
      is_staff: session.user.isStaff || false,
      staff_permissions: session.user.staffPermissions || [],
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(staffUser, 'donations')) {
      return apiForbidden('Keine Berechtigung für Spenden')
    }

    const { id } = await params

    // Check donation exists
    const existing = await query<{ id: string }>(`
      SELECT id FROM ${TABLE_NAMES.DONATIONS} WHERE id = $1
    `, [id])

    if (existing.rows.length === 0) {
      return apiNotFound('Spende')
    }

    // Soft delete by setting status to 'archived'
    await query(`
      UPDATE ${TABLE_NAMES.DONATIONS}
      SET status = 'archived', notes = COALESCE(notes, '') || $1
      WHERE id = $2
    `, [` [Archiviert am ${new Date().toISOString()} durch ${session.user.email}]`, id])

    logger.info('Donation archived', { donationId: id, archivedBy: session.user.id })

    return apiSuccess({ id, deleted: true })

  } catch (error) {
    logger.error('Failed to delete donation', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
