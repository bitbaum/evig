import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { validateBody, UpdateInvoiceSchema } from '@/lib/schemas'

interface InvoiceRow {
  id: string
  user_id: string
  status: string
  invoice_number: string
  total_cents: number
  subtotal_cents: number
  tax_cents: number
  customer_name: string
  customer_email: string
  total: number
  subtotal: number
  tax: number
  notes: string
  due_date: string
  billing_address: string
  shipping_address: string
  payment_terms: string
  line_items: unknown[]
}

// GET /api/invoices/[id] - Get invoice details
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get invoice details
    const invoiceResult = await query(`
      SELECT
        i.id, i.user_id, i.status, i.invoice_number, i.type,
        i.total_cents, i.subtotal_cents, i.tax_cents, i.currency, i.tax_rate,
        i.line_items, i.notes, i.due_date, i.issue_date,
        i.billing_address, i.shipping_address, i.payment_terms,
        i.metadata, i.created_at, i.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        ROUND(i.total_cents / 100.0, 2) as total,
        ROUND(i.subtotal_cents / 100.0, 2) as subtotal,
        ROUND(i.tax_cents / 100.0, 2) as tax
      FROM ${TABLE_NAMES.INVOICES} i
      JOIN ${TABLE_NAMES.USERS} u ON i.user_id = u.id
      WHERE i.id = $1
    `, [invoiceId])

    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Rechnung')
    }

    const invoice = invoiceResult.rows[0] as InvoiceRow

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung anzuzeigen')
    }

    return apiSuccess({ invoice })

  } catch (error) {
    logger.error('Get invoice error', { error })
    return apiError(error, 'Rechnung konnte nicht geladen werden')
  }
})

// PUT /api/invoices/[id] - Update invoice
export const PUT = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!
    const body = await request.json()
    const validation = validateBody(UpdateInvoiceSchema, body)
    if (!validation.success) return validation.error
    const updates = validation.data

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get current invoice
    const invoiceResult = await query(`SELECT id, user_id, status FROM ${TABLE_NAMES.INVOICES} WHERE id = $1`, [invoiceId])
    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Rechnung')
    }

    const invoice = invoiceResult.rows[0] as Pick<InvoiceRow, 'id' | 'user_id' | 'status'>

    // Check permissions - only admin can update others' invoices
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung zu aktualisieren')
    }

    // Build update query
    const updateFields = []
    const params = []
    let paramIndex = 1

    // Allowed update fields
    const allowedFields = [
      'status', 'notes', 'due_date', 'billing_address', 'shipping_address',
      'payment_terms', 'line_items'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        params.push(key === 'line_items' || key.includes('address') ? JSON.stringify(value) : value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return apiBadRequest('Keine gültigen Felder zum Aktualisieren')
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Execute update
    await query(`
      UPDATE ${TABLE_NAMES.INVOICES}
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `, [...params, invoiceId])

    // Get updated invoice
    const updatedResult = await query(`
      SELECT
        i.*,
        u.name as customer_name,
        u.email as customer_email,
        ROUND(i.total_cents / 100.0, 2) as total
      FROM ${TABLE_NAMES.INVOICES} i
      JOIN ${TABLE_NAMES.USERS} u ON i.user_id = u.id
      WHERE i.id = $1
    `, [invoiceId])

    return apiSuccess({
      invoice: updatedResult.rows[0],
      message: 'Rechnung erfolgreich aktualisiert'
    })

  } catch (error) {
    logger.error('Update invoice error', { error })
    return apiError(error, 'Rechnung konnte nicht aktualisiert werden')
  }
})

// DELETE /api/invoices/[id] - Delete invoice (only draft invoices)
export const DELETE = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get invoice
    const invoiceResult = await query(`SELECT id, user_id, status FROM ${TABLE_NAMES.INVOICES} WHERE id = $1`, [invoiceId])
    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Rechnung')
    }

    const invoice = invoiceResult.rows[0] as Pick<InvoiceRow, 'id' | 'user_id' | 'status'>

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung zu löschen')
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return apiBadRequest('Nur Rechnungsentwürfe können gelöscht werden')
    }

    // Delete invoice
    await query(`DELETE FROM ${TABLE_NAMES.INVOICES} WHERE id = $1`, [invoiceId])

    return apiSuccess({
      message: 'Rechnung erfolgreich gelöscht'
    })

  } catch (error) {
    logger.error('Delete invoice error', { error })
    return apiError(error, 'Rechnung konnte nicht gelöscht werden')
  }
})