/**
 * Admin Membership Page
 *
 * Shows all Verein members with their payment status.
 * Members join instantly; this page tracks who has paid.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { MEMBERSHIP } from '@/config/org'
import { MEMBERSHIP_TYPE_LABELS } from '@/config/membership-status'

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
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/membership')
  }

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

  return (
    <AdminPageWrapper
      title="Mitglieder"
      description={`${members.length} Vereinsmitglieder · ${totalApplications} Beitritte total`}
      icon={Users}
      iconColor="green"
    >
      <AdminStatsGrid items={stats} columns={3} />

      {/* Members List */}
      <div className="bg-surface-base rounded-xl border border overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <Heading level={3} className="text-lg text-text-primary mb-2">
              Noch keine Mitglieder
            </Heading>
            <p className="text-text-tertiary">Mitglieder erscheinen hier sobald jemand beitritt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised border-b border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Typ</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Dabei seit</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Bezahlt bis</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {members.map(member => {
                  const paid = isPaid(member)
                  const fee = member.member_type === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
                  return (
                    <tr key={member.id} className="hover:bg-surface-raised">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {member.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-secondary">
                          {MEMBERSHIP_TYPE_LABELS[(member.member_type || 'regular') as keyof typeof MEMBERSHIP_TYPE_LABELS] || member.member_type}
                        </span>
                        <span className="text-text-muted ml-1 text-xs">CHF {fee}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {member.member_since ? formatDateShort(member.member_since) : '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {member.member_paid_until ? formatDateShort(member.member_paid_until) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-action-muted-muted text-action rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Bezahlt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Offen
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  )
}
