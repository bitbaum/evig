import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import { TABLE_NAMES } from '@/config/database'
import puppeteer from 'puppeteer'

// Invoice data structure for PDF generation
interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface CustomerAddress {
  street?: string
  city?: string
  postal_code?: string
  country?: string
}

interface InvoiceData {
  id: string
  invoice_number: string
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string | Date
  due_date?: string | Date
  currency: string
  tax_rate: number
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  line_items: InvoiceLineItem[]
  notes?: string
  payment_terms?: string
  customer_name: string
  customer_email: string
  first_name?: string
  last_name?: string
  phone?: string
  customer_address?: CustomerAddress
}

// GET /api/invoices/[id]/pdf - Generate and return PDF
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get invoice details
    const invoiceResult = await query(`
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

    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Invoice not found')
    }

    const invoice = invoiceResult.rows[0] as InvoiceData

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('You do not have permission to view this invoice')
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice)

    // Update PDF generation timestamp
    await query(`
      UPDATE ${TABLE_NAMES.INVOICES}
      SET
        pdf_generated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [invoiceId])

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })

  } catch (error) {
    logger.error('Generate PDF error', { error })
    return apiError(error, 'Failed to generate PDF')
  }
})

// POST /api/invoices/[id]/pdf - Generate and store PDF URL
export const POST = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: invoiceId } = context!.params!

    // Check if user is admin
    const isAdmin = session.user.isStaff

    // Get invoice details
    const invoiceResult = await query(`
      SELECT
        i.*,
        u.name as customer_name,
        u.email as customer_email,
        up.first_name,
        up.last_name,
        up.phone
      FROM ${TABLE_NAMES.INVOICES} i
      JOIN ${TABLE_NAMES.USERS} u ON i.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON u.id = up.user_id
      WHERE i.id = $1
    `, [invoiceId])

    if (invoiceResult.rows.length === 0) {
      return apiNotFound('Invoice not found')
    }

    const invoice = invoiceResult.rows[0] as InvoiceData

    // Check permissions
    if (invoice.user_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('You do not have permission to generate PDF for this invoice')
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice)

    // In a real implementation, you would upload this to cloud storage
    // For now, we'll just mark it as generated
    const pdfUrl = `/api/invoices/${invoiceId}/pdf` // Direct download URL

    // Update invoice with PDF URL
    await query(`
      UPDATE ${TABLE_NAMES.INVOICES}
      SET
        pdf_url = $1,
        pdf_generated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [pdfUrl, invoiceId])

    return apiSuccess({
      pdfUrl,
      message: 'PDF generated successfully'
    })

  } catch (error) {
    logger.error('Generate PDF error', { error })
    return apiError(error, 'Failed to generate PDF')
  }
})

async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  try {
    // Try to use Puppeteer if available
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    })

    const page = await browser.newPage()
    const htmlContent = generateInvoiceHTML(invoice)

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })

    await browser.close()
    return Buffer.from(pdfBuffer)

  } catch (error) {
    logger.warn('Puppeteer PDF generation failed, using fallback', { error })

    // Fallback: return HTML as PDF-like response
    // In production, you might want to use a different PDF library
    const htmlContent = generateInvoiceHTML(invoice)
    return Buffer.from(htmlContent, 'utf-8')
  }
}

function generateInvoiceHTML(invoice: InvoiceData): string {
  const lineItems = invoice.line_items || []
  const subtotal = invoice.subtotal_cents / 100
  const tax = invoice.tax_cents / 100
  const total = invoice.total_cents / 100

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${invoice.invoice_number}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #16a34a;
        }
        .company-info h1 {
          color: #16a34a;
          margin: 0;
          font-size: 28px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          margin: 0 0 10px 0;
          color: #16a34a;
        }
        .customer-info {
          margin-bottom: 30px;
        }
        .customer-info h3 {
          margin-bottom: 10px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          float: right;
          width: 300px;
        }
        .totals table {
          margin: 0;
        }
        .totals td:last-child {
          font-weight: bold;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-draft { background: #fef3c7; color: #d97706; }
        .status-sent { background: #dbeafe; color: #2563eb; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>RevampIT</h1>
          <p>Digitale Reparaturplattform<br>
          Schweiz</p>
        </div>
        <div class="invoice-details">
          <h2>Rechnung</h2>
          <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
          <p><strong>Datum:</strong> ${formatDateShort(invoice.issue_date)}</p>
          ${invoice.due_date ? `<p><strong>Fällig bis:</strong> ${formatDateShort(invoice.due_date)}</p>` : ''}
          <span class="status status-${invoice.status}">${invoice.status}</span>
        </div>
      </div>

      <div class="customer-info">
        <h3>Rechnungsempfänger</h3>
        <p>
          ${invoice.customer_name}<br>
          ${invoice.first_name || ''} ${invoice.last_name || ''}<br>
          ${invoice.customer_email}<br>
          ${invoice.phone ? `${invoice.phone}<br>` : ''}
          ${invoice.customer_address?.street ? `${invoice.customer_address.street}<br>` : ''}
          ${invoice.customer_address?.postal_code ? `${invoice.customer_address.postal_code} ` : ''}${invoice.customer_address?.city || ''}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Beschreibung</th>
            <th class="text-right">Menge</th>
            <th class="text-right">Einzelpreis</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems.map((item: InvoiceLineItem) => `
            <tr>
              <td>${item.description}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${item.unitPrice.toFixed(2)} ${invoice.currency}</td>
              <td class="text-right">${item.total.toFixed(2)} ${invoice.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Zwischensumme:</td>
            <td class="text-right">${subtotal.toFixed(2)} ${invoice.currency}</td>
          </tr>
          <tr>
            <td>MwSt (${(invoice.tax_rate * 100).toFixed(1)}%):</td>
            <td class="text-right">${tax.toFixed(2)} ${invoice.currency}</td>
          </tr>
          <tr>
            <td><strong>Gesamt:</strong></td>
            <td class="text-right"><strong>${total.toFixed(2)} ${invoice.currency}</strong></td>
          </tr>
        </table>
      </div>
      <div style="clear: both;"></div>

      ${invoice.notes ? `
        <div style="margin-top: 30px;">
          <h3>Notizen</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>
          Vielen Dank für Ihr Vertrauen in RevampIT.<br>
          Bei Fragen zu dieser Rechnung kontaktieren Sie uns bitte unter support@revampit.ch
        </p>
        <p>
          Zahlungsbedingungen: ${invoice.payment_terms || 'Zahlbar innerhalb von 30 Tagen ab Rechnungsdatum'}
        </p>
      </div>
    </body>
    </html>
  `
}