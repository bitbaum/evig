import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { invoices, users, userProfiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { generateInvoicePDF, type InvoiceData } from '@/lib/invoices/pdf-template'

// GET /api/invoices/[id]/pdf - Generate and return PDF
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!
    const invoice = await fetchInvoice(invoiceId)

    if (!invoice) {
      return apiNotFound('Rechnung')
    }

    if (invoice.user_id !== session.user.id && !session.user.isStaff) {
      return apiUnauthorized('Sie haben keine Berechtigung, diese Rechnung anzuzeigen')
    }

    const pdfBuffer = await generateInvoicePDF(invoice)

    await db
      .update(invoices)
      .set({
        pdfGeneratedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(invoices.id, invoiceId))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Generate PDF error', { error })
    return apiError(error, 'PDF konnte nicht generiert werden')
  }
})

// POST /api/invoices/[id]/pdf - Generate and store PDF URL
export const POST = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!
    const invoice = await fetchInvoice(invoiceId)

    if (!invoice) {
      return apiNotFound('Rechnung')
    }

    if (invoice.user_id !== session.user.id && !session.user.isStaff) {
      return apiUnauthorized('Sie haben keine Berechtigung, ein PDF für diese Rechnung zu generieren')
    }

    await generateInvoicePDF(invoice)

    const pdfUrl = `/api/invoices/${invoiceId}/pdf`

    await db
      .update(invoices)
      .set({
        pdfUrl,
        pdfGeneratedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(invoices.id, invoiceId))

    return apiSuccess({ pdfUrl, message: 'PDF erfolgreich generiert' })
  } catch (error) {
    logger.error('Generate PDF error', { error })
    return apiError(error, 'PDF konnte nicht generiert werden')
  }
})

// ─── Helpers ────────────────────────────────────────────────────────

async function fetchInvoice(invoiceId: string): Promise<InvoiceData | null> {
  const [row] = await db
    .select({
      id: invoices.id,
      invoice_number: invoices.invoiceNumber,
      type: invoices.type,
      status: invoices.status,
      user_id: invoices.userId,
      order_id: invoices.orderId,
      service_appointment_id: invoices.serviceAppointmentId,
      workshop_registration_id: invoices.workshopRegistrationId,
      subtotal_cents: invoices.subtotalCents,
      tax_cents: invoices.taxCents,
      discount_cents: invoices.discountCents,
      total_cents: invoices.totalCents,
      currency: invoices.currency,
      tax_rate: invoices.taxRate,
      line_items: invoices.lineItems,
      billing_address: invoices.billingAddress,
      shipping_address: invoices.shippingAddress,
      issue_date: invoices.issueDate,
      due_date: invoices.dueDate,
      paid_at: invoices.paidAt,
      pdf_url: invoices.pdfUrl,
      pdf_generated_at: invoices.pdfGeneratedAt,
      emailed_at: invoices.emailedAt,
      email_recipient: invoices.emailRecipient,
      notes: invoices.notes,
      payment_terms: invoices.paymentTerms,
      created_at: invoices.createdAt,
      updated_at: invoices.updatedAt,
      customer_name: users.name,
      customer_email: users.email,
      first_name: userProfiles.firstName,
      last_name: userProfiles.lastName,
      phone: userProfiles.phone,
      customer_address: sql`jsonb_build_object(
        'street', ${userProfiles.addressLine1},
        'city', ${userProfiles.city},
        'postal_code', ${userProfiles.postalCode},
        'country', ${userProfiles.country}
      )`,
    })
    .from(invoices)
    .innerJoin(users, eq(invoices.userId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(invoices.id, invoiceId))

  return row ? (row as unknown as InvoiceData) : null
}
