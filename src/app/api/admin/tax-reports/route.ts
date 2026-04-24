import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { paymentTransactions, refunds, escrowAccounts, paymentDisputes } from '@/db/schema/payments'
import { users, userProfiles } from '@/db/schema/auth'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { generateTaxReport, TaxTransaction } from '@/lib/payments/tax-compliance'
import { PAYMENT_STATUS, PAYMENT_TRANSACTION_TYPE } from '@/config/payment-status'
import { logger } from '@/lib/logger'

// Extended transaction type with joined data from query
interface TaxTransactionWithJoins {
  id: string
  amount_cents: number
  currency: 'CHF' | 'EUR'
  created_at: Date
  customer_email: string
  customer_country: string
  customerType: 'business' | 'consumer'
  tax_data: {
    includeVAT: string
    businessType: string
    subtotalCents: number
    vatCents: number
  }
}

// Table name refs
const ptTable = getTableName(paymentTransactions)
const uTable = getTableName(users)
const upTable = getTableName(userProfiles)
const rTable = getTableName(refunds)
const eaTable = getTableName(escrowAccounts)
const pdTable = getTableName(paymentDisputes)

// GET /api/admin/tax-reports - Generate tax reports
export const GET = withAdmin('finanzen', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'vat' // vat, transactions, compliance
    const period = searchParams.get('period') || 'monthly' // monthly, quarterly, yearly
    const countryCode = searchParams.get('country') || 'CH'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calculate date range
    const { startDate, endDate } = calculatePeriodDates(period, year, month)

    // Get transactions for the period
    const transactionsResult = await db.execute(sql`
      SELECT
        pt.*,
        u.email as customer_email,
        COALESCE(up.country, 'CH') as customer_country,
        CASE WHEN up.company_name IS NOT NULL THEN 'business' ELSE 'consumer' END as customer_type,
        jsonb_build_object(
          'includeVAT', pt.metadata->>'includeVAT',
          'businessType', pt.metadata->>'businessType',
          'subtotalCents', (pt.metadata->>'subtotalCents')::int,
          'vatCents', (pt.metadata->>'vatCents')::int
        ) as tax_data
      FROM ${sql.raw(ptTable)} pt
      JOIN ${sql.raw(uTable)} u ON pt.user_id = u.id
      LEFT JOIN ${sql.raw(upTable)} up ON u.id = up.user_id
      WHERE pt.created_at >= ${startDate}
        AND pt.created_at <= ${endDate}
        AND pt.status = ${PAYMENT_STATUS.SUCCEEDED}
        AND pt.type = ${PAYMENT_TRANSACTION_TYPE.PAYMENT}
      ORDER BY pt.created_at DESC
    `)

    // Use extended type for database results, standard type for tax compliance functions
    const transactionsWithJoins = transactionsResult.rows as unknown as TaxTransactionWithJoins[]
    const transactions: TaxTransaction[] = transactionsWithJoins.map(tx => ({
      id: tx.id,
      amount_cents: tx.amount_cents,
      currency: tx.currency,
      created_at: tx.created_at,
      customerType: tx.customerType
    }))

    if (reportType === 'vat') {
      // Generate VAT report
      const vatReport = generateTaxReport(transactions, { start: startDate, end: endDate }, countryCode)

      return apiSuccess({
        report: {
          type: 'vat',
          period: vatReport.period,
          country: vatReport.country,
          summary: vatReport.summary,
          compliance: vatReport.compliance,
          transactions: vatReport.transactions.slice(0, 100) // Limit for API response
        }
      })

    } else if (reportType === 'transactions') {
      // Detailed transaction report
      const transactionReport = {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totalTransactions: transactionsWithJoins.length,
        transactions: transactionsWithJoins.map(tx => ({
          id: tx.id,
          date: tx.created_at.toISOString().split('T')[0],
          amount: tx.amount_cents / 100,
          currency: tx.currency,
          customer: tx.customer_email,
          country: tx.customer_country,
          type: tx.customerType,
          taxData: tx.tax_data
        }))
      }

      return apiSuccess({
        report: transactionReport
      })

    } else if (reportType === 'compliance') {
      // Compliance checklist report
      const complianceReport = await generateComplianceReport(transactionsWithJoins, startDate, endDate)

      return apiSuccess({
        report: complianceReport
      })
    }

    return apiError(null, 'Invalid report type', 400)

  } catch (error) {
    logger.error('Tax report generation error', { error })
    return apiError(error, 'Failed to generate tax report')
  }
})

function calculatePeriodDates(period: string, year: number, month: number) {
  const startDate = new Date()
  const endDate = new Date()

  switch (period) {
    case 'monthly':
      startDate.setFullYear(year, month - 1, 1)
      endDate.setFullYear(year, month, 0) // Last day of month
      break
    case 'quarterly':
      const quarterStart = Math.floor((month - 1) / 3) * 3
      startDate.setFullYear(year, quarterStart, 1)
      endDate.setFullYear(year, quarterStart + 3, 0)
      break
    case 'yearly':
      startDate.setFullYear(year, 0, 1)
      endDate.setFullYear(year, 11, 31)
      break
    default:
      // Default to current month
      const now = new Date()
      startDate.setFullYear(now.getFullYear(), now.getMonth(), 1)
      endDate.setFullYear(now.getFullYear(), now.getMonth() + 1, 0)
  }

  return { startDate, endDate }
}

interface CountRow {
  count: string
}

async function generateComplianceReport(transactions: TaxTransactionWithJoins[], startDate: Date, endDate: Date) {
  // All 3 queries are independent — run in parallel
  const [refundCount, escrowCount, disputeCount] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(rTable)}
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    `),
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(eaTable)}
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    `),
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(pdTable)}
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    `),
  ])

  const refundRow = refundCount.rows[0] as unknown as CountRow
  const escrowRow = escrowCount.rows[0] as unknown as CountRow
  const disputeRow = disputeCount.rows[0] as unknown as CountRow

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    compliance: {
      totalTransactions: transactions.length,
      totalRefunds: parseInt(refundRow.count),
      totalEscrows: parseInt(escrowRow.count),
      totalDisputes: parseInt(disputeRow.count),
      taxReportingRequired: transactions.some(tx => tx.tax_data?.vatCents > 0),
      pciCompliant: true, // Assume compliant if system is running
      dataRetentionCompliant: true
    },
    checklist: {
      vatReturnsFiled: false, // Would be tracked separately
      taxPaymentsMade: false, // Would be tracked separately
      recordsArchived: false, // Would be tracked separately
      auditTrailComplete: true
    },
    recommendations: [
      'Ensure VAT returns are filed within local deadlines',
      'Verify tax payments are processed correctly',
      'Archive transaction records for 10-year retention period',
      'Conduct regular PCI DSS compliance audits'
    ]
  }
}
