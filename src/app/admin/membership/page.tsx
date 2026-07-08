/**
 * Admin Membership Page
 *
 * Shows all Verein members with their payment status.
 * Members join instantly; this page tracks who has paid.
 */

import { Metadata } from 'next'
import { requireSection } from '@/lib/admin/guards'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { MEMBERSHIP } from '@/config/org'
import { MEMBERSHIP_TYPE_LABELS } from '@/config/membership-status'
import { MemberPaymentAction } from './MemberPaymentAction'

export const metadata: Metadata = {
  title: 'Mitgliedschaften',
  description: 'Vereinsmitglieder verwalten',
}

interface MemberRow {
  id: string
  name: string | null
  email: string
  member_since: string | null
  member_type: string | null
  member_paid_until: string | null
}

async function getMembers(): Promise<MemberRow[]> {
  try {
    const result = await query<MemberRow>(
      `SELECT id, name, email, member_since, member_type, member_paid_until
       FROM ${TABLE_NAMES.USERS}
       WHERE is_member = true
       ORDER BY member_since DESC NULLS LAST`
    )
    return result.rows
  } catch {
    return []
  }
}

async function getApplicationCount(): Promise<number> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}`
    )
    return parseInt(result.rows[0]?.count || '0')
  } catch {
    return 0
  }
}

function isPaid(member: MemberRow): boolean {
  if (!member.member_paid_until) return false
  return new Date(member.member_paid_until) > new Date()
}

export default async function MembershipPage() {
  // Member PII (names, emails, payment status) — enforce the section permission,
  // not just "is logged in".
  await requireSection('membership')

  const [members, totalApplications] = await Promise.all([
    getMembers(),
    getApplicationCount(),
  ])

  const paidCount = members.filter(isPaid).length
  const unpaidCount = members.length - paidCount

  const stats: StatCardItem[] = [
    { icon: Users, color: 'green', label: 'Mitglieder', value: members.length },
    { icon: CheckCircle, color: 'blue', label: 'Bezahlt', value: paidCount },
    { icon: AlertCircle, color: 'orange', label: 'Offen', value: unpaidCount, valueColor: unpaidCount > 0 ? 'text-secondary-600' : undefined },
  ]

  const columns: AdminTableColumn<MemberRow>[] = [
    { header: 'Name', cell: (m) => <span className="font-medium text-text-primary">{m.name || '—'}</span> },
    { header: 'E-Mail', cell: (m) => <span className="text-text-secondary">{m.email}</span> },
    {
      header: 'Typ',
      cell: (m) => {
        const fee = m.member_type === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
        return (
          <>
            <span className="text-text-secondary">
              {MEMBERSHIP_TYPE_LABELS[(m.member_type || 'regular') as keyof typeof MEMBERSHIP_TYPE_LABELS] || m.member_type}
            </span>
            <span className="text-text-muted ml-1 text-xs">CHF {fee}</span>
          </>
        )
      },
    },
    { header: 'Dabei seit', cell: (m) => <span className="text-text-secondary">{m.member_since ? formatDateShort(m.member_since) : '—'}</span> },
    { header: 'Bezahlt bis', cell: (m) => <span className="text-text-secondary">{m.member_paid_until ? formatDateShort(m.member_paid_until) : '—'}</span> },
    {
      header: 'Status',
      cell: (m) =>
        isPaid(m) ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-action-muted text-action rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />Bezahlt
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />Offen
          </span>
        ),
    },
    { header: 'Aktion', cell: (m) => <MemberPaymentAction memberId={m.id} paidUntil={m.member_paid_until} /> },
  ]

  // No members at all → single empty state, no dead stats grid.
  if (members.length === 0) {
    return (
      <AdminPageWrapper title="Mitglieder" description={`${totalApplications} Beitritte total`} icon={Users} iconColor="green">
        <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="font-medium text-text-primary">{ADMIN_CONTENT.membership.emptyTitle}</p>
          <p className="text-text-secondary mt-1">{ADMIN_CONTENT.membership.emptyDescription}</p>
        </div>
      </AdminPageWrapper>
    )
  }

  return (
    <AdminPageWrapper
      title="Mitglieder"
      description={`${members.length} Vereinsmitglieder · ${totalApplications} Beitritte total`}
      icon={Users}
      iconColor="green"
    >
      <AdminStatsGrid items={stats} columns={3} />
      <AdminTable columns={columns} rows={members} rowKey={(m) => m.id} />
    </AdminPageWrapper>
  )
}
