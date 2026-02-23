import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
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

    await query(`
      UPDATE ${TABLE_NAMES.INVOICES}
      SET pdf_generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [invoiceId])

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

    await query(`
      UPDATE ${TABLE_NAMES.INVOICES}
      SET pdf_url = $1, pdf_generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [pdfUrl, invoiceId])

    return apiSuccess({ pdfUrl, message: 'PDF erfolgreich generiert' })
  } catch (error) {
    logger.error('Generate PDF error', { error })
    return apiError(error, 'PDF konnte nicht generiert werden')
  }
})

// ─── Helpers ────────────────────────────────────────────────────────

async function fetchInvoice(invoiceId: string): Promise<InvoiceData | null> {
  const result = await query(`
    SELECT
      i.*,
      u.name as customer_name,
      u.email as customer_email,
      up.first_name,
      up.last_name,
      up.phone,
      jsonb_build_object(
        'street', up.street,
        'city', up.city,
        'postal_code', up.postal_code,
        'country', up.country
      ) as customer_address
    FROM ${TABLE_NAMES.INVOICES} i
    JOIN ${TABLE_NAMES.USERS} u ON i.user_id = u.id
    LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON u.id = up.user_id
    WHERE i.id = $1
  `, [invoiceId])

  return result.rows.length > 0 ? (result.rows[0] as InvoiceData) : null
}
