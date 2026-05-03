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

const MEMBER_TYPE_LABELS: Record<string, string> = {
  regular: 'Ordentlich',
  reduced: 'Ermässigt',
  honorary: 'Ehrenmitglied',
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
    { icon: AlertCircle, color: 'orange', label: 'Offen', value: unpaidCount, valueColor: unpaidCount > 0 ? 'text-orange-600' : undefined },
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Heading level={3} className="text-lg text-gray-900 dark:text-white mb-2">
              Noch keine Mitglieder
            </Heading>
            <p className="text-gray-500">Mitglieder erscheinen hier sobald jemand beitritt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Typ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Dabei seit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Bezahlt bis</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.map(member => {
                  const paid = isPaid(member)
                  const fee = member.member_type === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {member.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 dark:text-gray-300">
                          {MEMBER_TYPE_LABELS[member.member_type || 'regular'] || member.member_type}
                        </span>
                        <span className="text-gray-400 ml-1 text-xs">CHF {fee}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.member_since ? formatDateShort(member.member_since) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.member_paid_until ? formatDateShort(member.member_paid_until) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Bezahlt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
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
