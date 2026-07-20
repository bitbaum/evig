/**
 * /r/[token] — PUBLIC Monatsrapport (no login).
 *
 * The link an approver hands to a referring social worker: the report can't be
 * reached behind the admin login, and app email is not reliably deliverable, so
 * a tokenized bearer link is the delivery mechanism. View + print only; the
 * token is validated against report_shares (revocable). Never indexed.
 *
 * NOTE: `/r/` must be listed in src/proxy.ts BYPASS_INTL or this 404s through
 * the next-intl router (Next 16 middleware→proxy).
 */

import { notFound } from 'next/navigation'
import { getMonthlyReport } from '@/lib/services/report'
import { getReportShareByToken } from '@/lib/services/report-shares'
import { MonthlyReportSheet } from '@/components/team/MonthlyReportSheet'
import { ReportPrintButton } from '@/components/team/ReportPrintButton'

export const metadata = {
  title: 'Monatsrapport',
  robots: { index: false, follow: false },
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const share = await getReportShareByToken(token)
  if (!share) notFound()

  const report = await getMonthlyReport(share.userId, share.month)
  if (!report) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6 print:p-0">
      <div className="flex justify-end print:hidden">
        <ReportPrintButton />
      </div>
      <MonthlyReportSheet report={report} />
    </div>
  )
}
