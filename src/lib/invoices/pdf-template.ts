/**
 * Invoice PDF HTML Template
 *
 * Generates HTML for invoice PDF rendering via Puppeteer.
 * Separated from API route to keep route thin.
 */

import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import { SUPPORT_EMAIL } from '@/lib/constants'

// ─── Types ──────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface CustomerAddress {
  street?: string
  city?: string
  postal_code?: string
  country?: string
}

export interface InvoiceData {
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

// ─── PDF Generation ─────────────────────────────────────────────────

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    })

    const page = await browser.newPage()
    const htmlContent = generateInvoiceHTML(invoice)

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    })

    await browser.close()
    return Buffer.from(pdfBuffer)
  } catch (error) {
    logger.warn('Puppeteer PDF generation failed, using fallback', { error })
    const htmlContent = generateInvoiceHTML(invoice)
    return Buffer.from(htmlContent, 'utf-8')
  }
}

// ─── HTML Template ──────────────────────────────────────────────────

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
          Bei Fragen zu dieser Rechnung kontaktieren Sie uns bitte unter ${SUPPORT_EMAIL}
        </p>
        <p>
          Zahlungsbedingungen: ${invoice.payment_terms || 'Zahlbar innerhalb von 30 Tagen ab Rechnungsdatum'}
        </p>
      </div>
    </body>
    </html>
  `
}
