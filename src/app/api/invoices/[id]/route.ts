import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { isAdminRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

// GET /api/invoices/[id] - Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    const invoiceId = params.id

    // Check if user is admin
    const userRoleResult = await query('SELECT role FROM users WHERE id = $1', [session.user.id])
    const isAdmin = isAdminRole(userRoleResult.rows[0]?.role)

    // Get invoice details
    const invoiceResult = await query(`
      SELECT
        i.*,
        u.name as customer_name,
        u.email as customer_email,
        ROUND(i.total_cents / 100.0, 2) as total,
        ROUND(i.subtotal_cents / 100.0, 2) as subtotal,
        ROUND(i.tax_cents / 100.0, 2) as tax
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `, [invoiceId])

    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Invoice not found')
    }

    const invoice = invoiceResult.rows[0]

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('You do not have permission to view this invoice')
    }

    return apiSuccess({ invoice })

  } catch (error) {
    logger.error('Get invoice error', { error })
    return apiError(error, 'Failed to retrieve invoice')
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    const invoiceId = params.id
    const updates = await request.json()

    // Check if user is admin
    const userRoleResult = await query('SELECT role FROM users WHERE id = $1', [session.user.id])
    const isAdmin = isAdminRole(userRoleResult.rows[0]?.role)

    // Get current invoice
    const invoiceResult = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId])
    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Invoice not found')
    }

    const invoice = invoiceResult.rows[0]

    // Check permissions - only admin can update others' invoices
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('You do not have permission to update this invoice')
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
      return apiBadRequest('No valid fields to update')
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Execute update
    await query(`
      UPDATE invoices
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
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `, [invoiceId])

    return apiSuccess({
      invoice: updatedResult.rows[0],
      message: 'Invoice updated successfully'
    })

  } catch (error) {
    logger.error('Update invoice error', { error })
    return apiError(error, 'Failed to update invoice')
  }
}

// DELETE /api/invoices/[id] - Delete invoice (only draft invoices)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    const invoiceId = params.id

    // Check if user is admin
    const userRoleResult = await query('SELECT role FROM users WHERE id = $1', [session.user.id])
    const isAdmin = isAdminRole(userRoleResult.rows[0]?.role)

    // Get invoice
    const invoiceResult = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId])
    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Invoice not found')
    }

    const invoice = invoiceResult.rows[0]

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('You do not have permission to delete this invoice')
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return apiBadRequest('Only draft invoices can be deleted')
    }

    // Delete invoice
    await query('DELETE FROM invoices WHERE id = $1', [invoiceId])

    return apiSuccess({
      message: 'Invoice deleted successfully'
    })

  } catch (error) {
    logger.error('Delete invoice error', { error })
    return apiError(error, 'Failed to delete invoice')
  }
}