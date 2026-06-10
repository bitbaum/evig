/**
 * /admin/payroll — close a monthly Lohnlauf + download the CSV.
 *
 * Phase 5. Two halves:
 *   1. Top card: month picker, "Vorschau" auto-loads
 *      pending-approved-timecard count + hours for that month, then
 *      "Lohnlauf abschliessen" stamps the batch + locks the rows +
 *      snapshots rates.
 *   2. Below: list of past batches (period, who closed it + when,
 *      timecard count, total hours, exported timestamp) with a CSV
 *      download button per row.
 *
 * Super-admin only — the backend enforces, the page redirects on the
 * server.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { isSuperAdmin } from '@/lib/permissions'
import { requireSection } from '@/lib/admin/guards'
import { PayrollClient } from '@/components/admin/payroll/PayrollClient'

export const metadata: Metadata = {
  title: 'Lohnlauf · Payroll',
  description: 'Monatliche Lohnläufe abschliessen und für die Buchhaltung exportieren.',
}

export default async function PayrollPage() {
  // Payroll is even more sensitive than timecards: needs the timecards
  // permission AND super-admin. Section guard handles the first; the
  // explicit isSuperAdmin check handles the second.
  const session = await requireSection('timecards')
  if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
    redirect('/admin?error=payroll_super_admin_only')
  }

  return (
    <AdminPageWrapper
      title="Lohnlauf"
      description="Monat abschliessen, Stundensätze einfrieren und CSV für die Buchhaltung herunterladen."
      icon={Wallet}
      iconColor="green"
      backButton={{ href: '/admin/team', label: 'Team' }}
    >
      <PayrollClient />
    </AdminPageWrapper>
  )
}
