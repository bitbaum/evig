import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { calculateTaxes, generateTaxInvoiceData } from '@/lib/payments/tax-compliance'
import { TABLE_NAMES } from '@/config/database'
import { INVOICE_STATUS } from '@/config/invoice-status'
import { QueryParams } from '@/lib/api/query-builder'

interface LineItemInput {
  description: string
  quantity: number | string
  unitPrice: number | string
}

interface InvoiceCreatedRow {
  id: string
  invoice_number: string
  created_at: string
}

interface CountRow {
  total: string
}

// POST /api/invoices - Create new invoice
export const POST = withAuth(async (request, session) => {
  try {
    const {
      type = 'service',
      userId, // For admin creating invoices for others
      orderId,
      serviceAppointmentId,
      workshopRegistrationId,
      lineItems,
      dueDate,
      notes,
      taxRate = 0.077, // Swiss VAT rate
      currency = 'CHF',
      customerCountry = 'CH',
      customerType = 'consumer',
      businessType = 'service'
    } = await request.json()

    // Check if user is admin or creating invoice for themselves
    const isAdmin = session.user.isStaff
    const targetUserId = isAdmin && userId ? userId : session.user.id

    if (!targetUserId) {
      return apiBadRequest('Benutzer-ID erforderlich')
    }

    // Validate line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return apiBadRequest('Mindestens ein Rechnungsposten erforderlich')
    }

    // Calculate totals with tax compliance
    let subtotalCents = 0
    const processedLineItems = lineItems.map((item: LineItemInput) => {
      if (!item.description || !item.quantity || !item.unitPrice) {
        throw new Error('Invalid line item: description, quantity, and unitPrice required')
      }

      const quantity = parseFloat(String(item.quantity))
      const unitPrice = parseFloat(String(item.unitPrice))
      const total = quantity * unitPrice
      subtotalCents += Math.round(total * 100)

      return {
        description: item.description,
        quantity,
        unitPrice,
        total
      }
    })

    // Use tax compliance system for accurate tax calculation
    const taxCalculation = calculateTaxes(
      subtotalCents / 100,
      customerCountry,
      customerType,
      businessType,
      currency as 'CHF' | 'EUR'
    )

    const taxCents = Math.round(taxCalculation.vatAmount * 100)
    const totalCents = Math.round(taxCalculation.total * 100)

    // Create invoice with tax compliance data
    const invoiceResult = await query(`
      INSERT INTO ${TABLE_NAMES.INVOICES} (
        invoice_number,
        type,
        status,
        user_id,
        order_id,
        service_appointment_id,
        workshop_registration_id,
        subtotal_cents,
        tax_cents,
        total_cents,
        currency,
        tax_rate,
        line_items,
        due_date,
        notes,
        issue_date,
        metadata
      ) VALUES (
        generate_invoice_number(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_DATE, $15
      )
      RETURNING id, invoice_number, created_at
    `, [
      type,
      INVOICE_STATUS.DRAFT,
      targetUserId,
      orderId || null,
      serviceAppointmentId || null,
      workshopRegistrationId || null,
      subtotalCents,
      taxCents,
      totalCents,
      currency,
      taxCalculation.vatRate,
      JSON.stringify(processedLineItems),
      dueDate || null,
      notes || null,
      JSON.stringify({
        taxCompliance: {
          customerCountry,
          customerType,
          businessType,
          taxRegime: taxCalculation.regime,
          reverseCharge: taxCalculation.regime === 'reverse_charge',
          vatReportingRequired: taxCalculation.vatAmount > 0
        },
        taxBreakdown: {
          taxableAmount: taxCalculation.breakdown.taxableAmount,
          vatExemptAmount: taxCalculation.breakdown.vatExemptAmount,
          reverseChargeAmount: taxCalculation.breakdown.reverseChargeAmount
        }
      })
    ])

    const invoice = invoiceResult.rows[0] as InvoiceCreatedRow

    return apiSuccess({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: INVOICE_STATUS.DRAFT,
      total: totalCents / 100,
      currency,
      createdAt: invoice.created_at
    })

  } catch (error) {
    logger.error('Invoice creation error', { error })
    return apiError(error, 'Rechnung konnte nicht erstellt werden')
  }
})

// GET /api/invoices - List invoices
export const GET = withAuth(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if user is admin
    const isAdmin = session.user.isStaff

    const qb = new QueryParams()

    if (!isAdmin) {
      qb.add('i.user_id = $P', session.user.id)
    }
    if (status) {
      qb.add('i.status = $P', status)
    }
    if (type) {
      qb.add('i.type = $P', type)
    }

    const { where: whereClause, params, nextIndex } = qb.build()

    // Get invoices with user info
    const invoicesResult = await query(`
      SELECT
        i.id, i.invoice_number, i.type, i.status, i.user_id,
        i.total_cents, i.subtotal_cents, i.tax_cents, i.currency,
        i.due_date, i.issue_date, i.created_at, i.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        ROUND(i.total_cents / 100.0, 2) as total,
        ROUND(i.subtotal_cents / 100.0, 2) as subtotal,
        ROUND(i.tax_cents / 100.0, 2) as tax
      FROM ${TABLE_NAMES.INVOICES} i
      JOIN ${TABLE_NAMES.USERS} u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.INVOICES} i
      ${whereClause}
    `, params)

    return apiSuccess({
      invoices: invoicesResult.rows,
      total: parseInt((countResult.rows[0] as CountRow).total),
      limit,
      offset
    })

  } catch (error) {
    logger.error('List invoices error', { error })
    return apiError(error, 'Rechnungen konnten nicht geladen werden')
  }
})