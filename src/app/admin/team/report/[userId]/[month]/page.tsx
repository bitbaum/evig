/**
 * /admin/team/report/[userId]/[month] — printable Monatsrapport.
 *
 * One sheet, three audiences: the team member, the accountant (replaces the
 * legacy SMALL-Time PDF), and the referring social worker. Browser
 * print-to-PDF via the print button; `.print-area` in globals.css isolates
 * the sheet from the admin chrome when printing. The sheet body itself lives in
 * the shared <MonthlyReportSheet> (also rendered by the public /r/[token] page).
 *
 * The DOCUMENT body is deliberately German (official record); UI chrome is too.
 */

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getMonthlyReport, REPORT_MONTH_REGEX } from '@/lib/services/report'
import { getReportShareToken } from '@/lib/services/report-shares'
import { MonthlyReportSheet } from '@/components/team/MonthlyReportSheet'
import { ReportPrintButton } from '@/components/team/ReportPrintButton'
import { ReportShareCard } from '@/components/team/ReportShareCard'

export const metadata = { title: 'Monatsrapport' }

export default async function MonthlyReportPage({
  params,
}: {
  params: Promise<{ userId: string; month: string }>
}) {
  const { userId, month } = await params
  if (!REPORT_MONTH_REGEX.test(month)) notFound()

  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/admin')
  const isOwn = session.user.id === userId
  const mayView = isOwn || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
    is_super_admin: session.user.isSuperAdmin,
  }, 'timecards')
  if (!mayView) redirect('/admin?error=no_timecards_access')

  const [report, shareToken] = await Promise.all([
    getMonthlyReport(userId, month),
    getReportShareToken(userId, month),
  ])
  if (!report) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6 print:p-0">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <p className="text-sm text-text-tertiary">
          Monatsrapport — als PDF sichern über «Drucken» (Ziel: «Als PDF speichern»).
        </p>
        <ReportPrintButton />
      </div>

      <div className="print:hidden">
        <ReportShareCard userId={userId} month={month} initialToken={shareToken} />
      </div>

      <MonthlyReportSheet report={report} />
    </div>
  )
}
