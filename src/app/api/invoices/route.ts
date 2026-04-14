import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { invoices, users } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { calculateTaxes } from '@/lib/payments/tax-compliance'
import { INVOICE_STATUS } from '@/config/invoice-status'
import { z } from 'zod'
import { validateBody } from '@/lib/schemas'

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))),
  unitPrice: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))),
})

const CreateInvoiceSchema = z.object({
  type: z.enum(['service', 'product', 'repair', 'membership', 'donation']).default('service'),
  userId: z.string().uuid().optional(), // Only admins may pass this
  orderId: z.string().optional(),
  serviceAppointmentId: z.string().optional(),
  workshopRegistrationId: z.string().optional(),
  lineItems: z.array(LineItemSchema).min(1),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).default(0.077), // Swiss VAT
  currency: z.string().length(3).default('CHF'),
  customerCountry: z.string().length(2).default('CH'),
  customerType: z.enum(['consumer', 'business']).default('consumer'),
  businessType: z.enum(['service', 'digital', 'physical']).default('service'),
})

// POST /api/invoices - Create new invoice
export const POST = withAuth(async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(CreateInvoiceSchema, body)
    if (!validation.success) return validation.error

    const {
      type,
      userId,
      orderId,
      serviceAppointmentId,
      workshopRegistrationId,
      lineItems,
      dueDate,
      notes,
      taxRate,
      currency,
      customerCountry,
      customerType,
      businessType,
    } = validation.data

    // Check if user is admin or creating invoice for themselves
    const isAdmin = session.user.isStaff
    const targetUserId = isAdmin && userId ? userId : session.user.id

    if (!targetUserId) {
      return apiBadRequest('Benutzer-ID erforderlich')
    }

    // Calculate totals with tax compliance
    let subtotalCents = 0
    const processedLineItems = lineItems.map((item) => {
      const total = item.quantity * item.unitPrice
      subtotalCents += Math.round(total * 100)
      return { description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, total }
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

    // Generate invoice number first
    const numResult = await db.execute(sql`SELECT generate_invoice_number() as num`)
    const num = (numResult.rows[0] as { num: string }).num

    // Create invoice with tax compliance data
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: num,
        type,
        status: INVOICE_STATUS.DRAFT,
        userId: targetUserId,
        orderId: orderId || undefined,
        serviceAppointmentId: serviceAppointmentId || undefined,
        workshopRegistrationId: workshopRegistrationId || undefined,
        subtotalCents,
        taxCents,
        totalCents,
        currency,
        taxRate: String(taxCalculation.vatRate),
        lineItems: processedLineItems,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        metadata: {
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
        },
      })
      .returning({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        createdAt: invoices.createdAt,
      })

    return apiSuccess({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: INVOICE_STATUS.DRAFT,
      total: totalCents / 100,
      currency,
      createdAt: invoice.createdAt
    })

  } catch (error) {
    logger.error('Invoice creation error', { error })
    return apiError(error, 'Rechnung konnte nicht erstellt werden')
  }
})

// GET /api/invoices - List invoices
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const { limit, offset } = parsePagination(request, { defaultLimit: 20 })

    // Check if user is admin
    const isAdmin = session.user.isStaff

    const conditions = []
    if (!isAdmin) {
      conditions.push(eq(invoices.userId, session.user.id))
    }
    if (status) {
      conditions.push(eq(invoices.status, status))
    }
    if (type) {
      conditions.push(eq(invoices.type, type))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Get invoices with user info
    const rows = await db
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
        due_date: invoices.dueDate,
        issue_date: invoices.issueDate,
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
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(invoices)
      .where(where)

    return apiSuccess({
      invoices: rows,
      total: Number(countRow?.total ?? 0),
      limit,
      offset
    })

  } catch (error) {
    logger.error('List invoices error', { error })
    return apiError(error, 'Rechnungen konnten nicht geladen werden')
  }
})
