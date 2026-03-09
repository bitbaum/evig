import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { invoices, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, UpdateInvoiceSchema } from '@/lib/schemas'

// GET /api/invoices/[id] - Get invoice details
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get invoice details
    const [invoice] = await db
      .select({
        id: invoices.id,
        user_id: invoices.userId,
        status: invoices.status,
        invoice_number: invoices.invoiceNumber,
        type: invoices.type,
        total_cents: invoices.totalCents,
        subtotal_cents: invoices.subtotalCents,
        tax_cents: invoices.taxCents,
        currency: invoices.currency,
        tax_rate: invoices.taxRate,
        line_items: invoices.lineItems,
        notes: invoices.notes,
        due_date: invoices.dueDate,
        issue_date: invoices.issueDate,
        billing_address: invoices.billingAddress,
        shipping_address: invoices.shippingAddress,
        payment_terms: invoices.paymentTerms,
        created_at: invoices.createdAt,
        updated_at: invoices.updatedAt,
        customer_name: users.name,
        customer_email: users.email,
        total: sql<string>`ROUND(${invoices.totalCents} / 100.0, 2)`,
        subtotal: sql<string>`ROUND(${invoices.subtotalCents} / 100.0, 2)`,
        tax: sql<string>`ROUND(${invoices.taxCents} / 100.0, 2)`,
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, invoiceId))

    if (!invoice) {
      return apiNotFound('Rechnung')
    }

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
export const PUT = withAuth<{ id: string }>(async (request: NextRequest, session, context) => {
  try {
    const { id: invoiceId } = context!.params!
    const body = await request.json()
    const validation = validateBody(UpdateInvoiceSchema, body)
    if (!validation.success) return validation.error
    const updates = validation.data

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get current invoice
    const [invoice] = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        status: invoices.status,
      })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))

    if (!invoice) {
      return apiNotFound('Rechnung')
    }

    // Check permissions - only admin can update others' invoices
    if (invoice.userId !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung zu aktualisieren')
    }

    // Build update set
    const updateSet: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` }
    const allowedFields: Record<string, string> = {
      status: 'status',
      notes: 'notes',
      due_date: 'dueDate',
      billing_address: 'billingAddress',
      shipping_address: 'shippingAddress',
      payment_terms: 'paymentTerms',
      line_items: 'lineItems',
    }

    let hasUpdates = false
    for (const [key, value] of Object.entries(updates)) {
      const drizzleField = allowedFields[key]
      if (drizzleField) {
        const processedValue = (key === 'line_items' || key.includes('address'))
          ? JSON.stringify(value)
          : value
        updateSet[drizzleField] = processedValue
        hasUpdates = true
      }
    }

    if (!hasUpdates) {
      return apiBadRequest('Keine gültigen Felder zum Aktualisieren')
    }

    // Execute update
    await db
      .update(invoices)
      .set(updateSet)
      .where(eq(invoices.id, invoiceId))

    // Get updated invoice
    const [updated] = await db
      .select({
        id: invoices.id,
        invoice_number: invoices.invoiceNumber,
        type: invoices.type,
        status: invoices.status,
        user_id: invoices.userId,
        total_cents: invoices.totalCents,
        subtotal_cents: invoices.subtotalCents,
        tax_cents: invoices.taxCents,
        currency: invoices.currency,
        notes: invoices.notes,
        due_date: invoices.dueDate,
        billing_address: invoices.billingAddress,
        shipping_address: invoices.shippingAddress,
        payment_terms: invoices.paymentTerms,
        created_at: invoices.createdAt,
        updated_at: invoices.updatedAt,
        customer_name: users.name,
        customer_email: users.email,
        total: sql<string>`ROUND(${invoices.totalCents} / 100.0, 2)`,
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, invoiceId))

    return apiSuccess({
      invoice: updated,
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
    const [invoice] = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        status: invoices.status,
      })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))

    if (!invoice) {
      return apiNotFound('Rechnung')
    }

    // Check permissions
    if (invoice.userId !== session.user.id && !isAdmin) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung zu löschen')
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return apiBadRequest('Nur Rechnungsentwürfe können gelöscht werden')
    }

    // Delete invoice
    await db
      .delete(invoices)
      .where(eq(invoices.id, invoiceId))

    return apiSuccess({
      message: 'Rechnung erfolgreich gelöscht'
    })

  } catch (error) {
    logger.error('Delete invoice error', { error })
    return apiError(error, 'Rechnung konnte nicht gelöscht werden')
  }
})
