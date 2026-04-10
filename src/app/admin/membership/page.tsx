/**
 * Admin Membership Page - Server Component
 *
 * Shows all membership applications with approve/reject actions for pending ones.
 * Filter tabs by status: pending / approved / rejected.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatDateShort } from '@/lib/date-formats'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/ui/Heading'
import { MembershipActions } from './MembershipActions'

export const metadata: Metadata = {
  title: 'Mitgliedschaften | RevampIT Admin',
  description: 'Mitgliedschaftsanträge prüfen und verwalten.',
}

interface MembershipApplication {
  id: string
  user_id: string | null
  applicant_name: string
  applicant_email: string
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
  member_type: string
  motivation: string | null
  status: string
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewer_name: string | null
}

interface Stats {
  pending: number
  approved: number
  rejected: number
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

async function getStats(): Promise<Stats> {
  try {
    const result = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS}
       GROUP BY status`
    )
    const counts: Stats = { pending: 0, approved: 0, rejected: 0 }
    for (const row of result.rows) {
      if (row.status === 'pending') counts.pending = parseInt(row.count)
      else if (row.status === 'approved') counts.approved = parseInt(row.count)
      else if (row.status === 'rejected') counts.rejected = parseInt(row.count)
    }
    return counts
  } catch {
    return { pending: 0, approved: 0, rejected: 0 }
  }
}

async function getApplications(status: StatusFilter): Promise<MembershipApplication[]> {
  try {
    const whereClause = status === 'all' ? '' : `WHERE a.status = '${status}'`
    const result = await query<MembershipApplication>(
      `SELECT
        a.id,
        a.user_id,
        a.applicant_name,
        a.applicant_email,
        a.address_street,
        a.address_postal_code,
        a.address_city,
        a.member_type,
        a.motivation,
        a.status,
        a.admin_notes,
        a.created_at,
        a.reviewed_at,
        u.name as reviewer_name
       FROM ${TABLE_NAMES.MEMBERSHIP_APPLICATIONS} a
       LEFT JOIN ${TABLE_NAMES.USERS} u ON a.reviewed_by = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT 100`
    )
    return result.rows
  } catch {
    return []
  }
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  regular: 'Ordentlich',
  reduced: 'Ermässigt',
  honorary: 'Ehrenmitglied',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function MembershipPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/membership')
  }

  const resolvedParams = await searchParams
  const statusFilter: StatusFilter =
    (['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).includes(
      resolvedParams.status as StatusFilter
    )
      ? (resolvedParams.status as StatusFilter)
      : 'pending'

  const [stats, applications] = await Promise.all([
    getStats(),
    getApplications(statusFilter),
  ])

  const tabs: { label: string; value: StatusFilter; count?: number }[] = [
    { label: 'Ausstehend', value: 'pending', count: stats.pending },
    { label: 'Genehmigt', value: 'approved', count: stats.approved },
    { label: 'Abgelehnt', value: 'rejected', count: stats.rejected },
    { label: 'Alle', value: 'all' },
  ]

  return (
    <AdminPageWrapper
      title="Mitgliedschaften"
      description="Mitgliedschaftsanträge prüfen und verwalten"
      icon={Users}
      iconColor="green"
    >
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.pending}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Ausstehend</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.approved}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Genehmigt</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.rejected}</p>
              <p className="text-sm text-red-600 dark:text-red-400">Abgelehnt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <a
            key={tab.value}
            href={`/admin/membership?status=${tab.value}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab.count > 0 && tab.value === 'pending'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {tab.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Anträge gefunden
            </Heading>
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === 'pending'
                ? 'Es gibt keine ausstehenden Mitgliedschaftsanträge.'
                : `Keine Anträge mit Status "${STATUS_LABELS[statusFilter] ?? statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {applications.map(app => (
              <div key={app.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Applicant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Heading level={3} className="text-base font-semibold text-gray-900 dark:text-white">
                        {app.applicant_name}
                      </Heading>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? ''}`}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {MEMBER_TYPE_LABELS[app.member_type] ?? app.member_type}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>{app.applicant_email}</p>
                      {(app.address_street || app.address_city) && (
                        <p>
                          {[app.address_street, app.address_postal_code, app.address_city]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      <p>Eingereicht: {formatDateShort(app.created_at)}</p>
                      {app.reviewed_at && (
                        <p>
                          Bearbeitet: {formatDate(app.reviewed_at)}
                          {app.reviewer_name ? ` von ${app.reviewer_name}` : ''}
                        </p>
                      )}
                    </div>

                    {app.motivation && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Motivation
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                          {app.motivation}
                        </p>
                      </div>
                    )}

                    {app.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Admin-Notiz
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{app.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for pending applications */}
                  {app.status === 'pending' && (
                    <div className="shrink-0">
                      <MembershipActions applicationId={app.id} applicantName={app.applicant_name} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  )
}
