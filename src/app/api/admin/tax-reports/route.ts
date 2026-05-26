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
  // Swiss-local YYYY-MM-DD date of the transaction, computed in Postgres
  // via (pt.created_at AT TIME ZONE 'Europe/Zurich')::date. Use this for
  // any per-transaction date display so a 00:30 Zurich transaction shows
  // up on its actual local date, not the UTC date (which would be the
  // prior day).
  zurich_date: string
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

    // Calculate date range in Swiss-local time (Europe/Zurich)
    const { start: startDate, end: endDate, nextStart } = calculatePeriodDates(period, year, month)

    // Get transactions for the period. AT TIME ZONE 'Europe/Zurich' converts
    // the Swiss-local naive date to a timestamp instant for comparison with
    // pt.created_at (timestamp with time zone, stored as UTC). Using < on
    // nextStart gives a clean exclusive upper bound — captures all of the
    // last day in Swiss-local time without the precision-creep of
    // <= end + 23:59:59.999999.
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
        ) as tax_data,
        ((pt.created_at AT TIME ZONE 'Europe/Zurich')::date)::text as zurich_date
      FROM ${sql.raw(ptTable)} pt
      JOIN ${sql.raw(uTable)} u ON pt.user_id = u.id
      LEFT JOIN ${sql.raw(upTable)} up ON u.id = up.user_id
      WHERE pt.created_at >= ${startDate}::date AT TIME ZONE 'Europe/Zurich'
        AND pt.created_at < ${nextStart}::date AT TIME ZONE 'Europe/Zurich'
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
      // Detailed transaction report. Period boundaries are already Swiss-
      // local strings from calculatePeriodDates. Per-transaction `date`
      // uses the zurich_date column computed in the SQL (correct for the
      // 00:00–02:00 Zurich window where UTC and local diverge).
      const transactionReport = {
        period: {
          start: startDate,
          end: endDate,
        },
        totalTransactions: transactionsWithJoins.length,
        transactions: transactionsWithJoins.map(tx => ({
          id: tx.id,
          date: tx.zurich_date,
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
      // Compliance checklist report — same Swiss-local boundary semantics
      // as the transactions query above.
      const complianceReport = await generateComplianceReport(transactionsWithJoins, startDate, nextStart)

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

/**
 * Compute VAT reporting period boundaries in Europe/Zurich local time.
 *
 * Returns Swiss-local calendar dates as YYYY-MM-DD strings:
 *   - start:     first day of the period (inclusive)
 *   - end:       last day of the period (inclusive — for display)
 *   - nextStart: day AFTER end (used as the SQL exclusive upper bound)
 *
 * Why strings + Postgres AT TIME ZONE: the previous Date-based logic
 * computed boundaries in the server's local timezone (UTC on Vercel/
 * Node), so a transaction at 00:30 Zurich on Jan 1 (= 23:30 UTC Dec 31
 * in winter) was attributed to the PRIOR year's VAT period — a real
 * accounting drift at year-end. Returning naive Swiss-local dates and
 * letting Postgres convert via `${date}::date AT TIME ZONE 'Europe/
 * Zurich'` keeps the boundary math in a system with full IANA tz +
 * DST support, instead of trying to hand-roll DST detection in JS.
 *
 * `nextStart` is exposed separately for `created_at < nextStart` SQL
 * comparisons — cleaner than `<= end::date + 23:59:59.999999` because
 * Postgres's `date` cast already gives us a clean exclusive upper.
 */
function calculatePeriodDates(period: string, year: number, month: number): {
  start: string
  end: string
  nextStart: string
} {
  function pad(n: number): string { return n.toString().padStart(2, '0') }
  function ymd(y: number, m: number, d: number): string {
    return `${y}-${pad(m + 1)}-${pad(d)}`
  }
  // Date.UTC + getUTCDate gives the correct last-day-of-month regardless
  // of timezone, since it's purely calendar arithmetic.
  function lastDayOfMonth(y: number, m: number): number {
    return new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  }

  let startY: number, startM: number
  let endY: number, endM: number, endD: number
  let nextY: number, nextM: number, nextD: number

  switch (period) {
    case 'monthly':
      startY = year; startM = month - 1
      endY = year; endM = month - 1; endD = lastDayOfMonth(year, month - 1)
      // Next start = first day of next month
      nextY = endM === 11 ? year + 1 : year
      nextM = endM === 11 ? 0 : endM + 1
      nextD = 1
      break
    case 'quarterly':
      const quarterStart = Math.floor((month - 1) / 3) * 3
      startY = year; startM = quarterStart
      endY = year; endM = quarterStart + 2; endD = lastDayOfMonth(year, quarterStart + 2)
      nextY = endM === 11 ? year + 1 : year
      nextM = endM === 11 ? 0 : endM + 1
      nextD = 1
      break
    case 'yearly':
      startY = year; startM = 0
      endY = year; endM = 11; endD = 31
      nextY = year + 1; nextM = 0; nextD = 1
      break
    default:
      // Default to current month (in Zurich local time)
      const nowParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Zurich',
        year: 'numeric', month: '2-digit',
      }).formatToParts(new Date())
      const nowY = Number(nowParts.find(p => p.type === 'year')?.value ?? new Date().getUTCFullYear())
      const nowM = Number(nowParts.find(p => p.type === 'month')?.value ?? 1) - 1
      startY = nowY; startM = nowM
      endY = nowY; endM = nowM; endD = lastDayOfMonth(nowY, nowM)
      nextY = endM === 11 ? nowY + 1 : nowY
      nextM = endM === 11 ? 0 : endM + 1
      nextD = 1
  }

  return {
    start: ymd(startY, startM, 1),
    end: ymd(endY, endM, endD),
    nextStart: ymd(nextY, nextM, nextD),
  }
}

interface CountRow {
  count: string
}

// Swiss-local period boundaries match the main transactions query: pass
// the period start (inclusive YYYY-MM-DD in Zurich tz) and the day AFTER
// the period end (exclusive YYYY-MM-DD), then AT TIME ZONE 'Europe/Zurich'
// converts each to the corresponding UTC instant for comparison with
// created_at. Display reuses the start string + computes endDay = nextStart
// minus one day (the inclusive last day).
async function generateComplianceReport(transactions: TaxTransactionWithJoins[], startDate: string, nextStart: string) {
  // All 3 queries are independent — run in parallel
  const [refundCount, escrowCount, disputeCount] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(rTable)}
      WHERE created_at >= ${startDate}::date AT TIME ZONE 'Europe/Zurich'
        AND created_at < ${nextStart}::date AT TIME ZONE 'Europe/Zurich'
    `),
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(eaTable)}
      WHERE created_at >= ${startDate}::date AT TIME ZONE 'Europe/Zurich'
        AND created_at < ${nextStart}::date AT TIME ZONE 'Europe/Zurich'
    `),
    db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(pdTable)}
      WHERE created_at >= ${startDate}::date AT TIME ZONE 'Europe/Zurich'
        AND created_at < ${nextStart}::date AT TIME ZONE 'Europe/Zurich'
    `),
  ])

  const refundRow = refundCount.rows[0] as unknown as CountRow
  const escrowRow = escrowCount.rows[0] as unknown as CountRow
  const disputeRow = disputeCount.rows[0] as unknown as CountRow

  // Compute the inclusive last-day-of-period from nextStart for display:
  // subtract one day in calendar terms.
  const endDay = (() => {
    const [y, m, d] = nextStart.split('-').map(Number)
    // Use UTC to do calendar math — pure date arithmetic, no tz issues
    const dt = new Date(Date.UTC(y, m - 1, d - 1))
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
  })()

  return {
    period: {
      start: startDate,
      end: endDay,
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
