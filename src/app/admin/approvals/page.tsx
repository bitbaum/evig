/**
 * Admin Approvals Page - Server Component
 *
 * Shows pending user content submissions that need admin approval.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { CheckSquare, Clock, CheckCircle, XCircle, FileText, Shield, ExternalLink } from 'lucide-react'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { formatDateShort } from '@/lib/date-formats'
import { isSuperAdmin } from '@/lib/permissions'
import { ApprovalActions } from './ApprovalActions'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Link from 'next/link'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
  title: 'Freigaben | RevampIT Admin',
  description: 'Eingereichte Inhalte prüfen und freigeben.',
}

interface ContentSubmission {
  id: string
  content_type: string
  title: string
  summary: string | null
  status: string
  submitted_at: string
  user_name: string | null
  user_email: string
}

interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
}

interface ApprovalSource {
  label: string
  count: number
  href: string
}

async function getApprovalSourceCounts(): Promise<ApprovalSource[]> {
  const sources: ApprovalSource[] = []

  const queries = [
    {
      label: 'Blog-Beiträge',
      href: '/admin/content/submissions',
      sql: `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE status = 'pending'`,
    },
    {
      label: 'Workshop-Vorschläge',
      href: '/admin/workshops',
      sql: `SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} WHERE status = 'pending'`,
    },
    {
      label: 'Techniker-Bewerbungen',
      href: '/admin/repairer-applications',
      sql: `SELECT COUNT(*) as count FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE status = 'pending'`,
    },
    {
      label: 'Standorte',
      href: '/admin/locations',
      sql: `SELECT COUNT(*) as count FROM ${TABLE_NAMES.LOCATIONS} WHERE approval_status = 'pending'`,
    },
  ]

  for (const q of queries) {
    try {
      const result = await query<{ count: string }>(q.sql)
      sources.push({ label: q.label, count: parseInt(result.rows[0]?.count || '0'), href: q.href })
    } catch {
      // Table might not exist yet
      sources.push({ label: q.label, count: 0, href: q.href })
    }
  }

  return sources
}

async function getApprovalStats(): Promise<ApprovalStats> {
  try {
    const allowedTypes = ['workshop', 'blog_post']

    // Get pending count (workshops and blog posts only)
    const pendingResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
       WHERE status = '${APPROVAL_STATUS.PENDING}' AND content_type = ANY($1)`,
      [allowedTypes]
    )
    const pending = parseInt(pendingResult.rows[0]?.count || '0')

    // Get approved count (last 30 days)
    const approvedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
       WHERE status = '${APPROVAL_STATUS.APPROVED}'
       AND content_type = ANY($1)
       AND reviewed_at >= NOW() - INTERVAL '30 days'`,
      [allowedTypes]
    )
    const approved = parseInt(approvedResult.rows[0]?.count || '0')

    // Get rejected count (last 30 days)
    const rejectedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
       WHERE status = '${APPROVAL_STATUS.REJECTED}'
       AND content_type = ANY($1)
       AND reviewed_at >= NOW() - INTERVAL '30 days'`,
      [allowedTypes]
    )
    const rejected = parseInt(rejectedResult.rows[0]?.count || '0')

    return { pending, approved, rejected }
  } catch {
    // Table might not exist yet
    return { pending: 0, approved: 0, rejected: 0 }
  }
}

async function getPendingSubmissions(): Promise<ContentSubmission[]> {
  try {
    const allowedTypes = ['workshop', 'blog_post']
    const result = await query<ContentSubmission>(
      `SELECT
        s.id,
        s.content_type,
        s.title,
        s.summary,
        s.status,
        s.submitted_at,
        u.name as user_name,
        u.email as user_email
       FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} s
       JOIN ${TABLE_NAMES.USERS} u ON s.user_id = u.id
       WHERE s.status = '${APPROVAL_STATUS.PENDING}' AND s.content_type = ANY($1)
       ORDER BY s.submitted_at DESC
       LIMIT 50`,
      [allowedTypes]
    )
    return result.rows
  } catch {
    // Table might not exist yet
    return []
  }
}

const contentTypeLabels: Record<string, string> = {
  workshop: 'Workshop',
  blog_post: 'Blog-Artikel',
}

export default async function ApprovalsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/approvals')
  }

  const isSuper = isSuperAdmin(session.user.email)

  const [stats, pendingItems, approvalSources] = await Promise.all([
    getApprovalStats(),
    getPendingSubmissions(),
    getApprovalSourceCounts(),
  ])

  const totalPendingAllSources = approvalSources.reduce((sum, s) => sum + s.count, 0) + stats.pending

  return (
    <AdminPageWrapper
      title="Freigaben"
      description="Eingereichte Inhalte von Benutzern prüfen und freigeben"
      icon={CheckSquare}
      iconColor="orange"
    >
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{totalPendingAllSources}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Ausstehend (gesamt)</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.approved}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Genehmigt (30 Tage)</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.rejected}</p>
              <p className="text-sm text-red-600 dark:text-red-400">Abgelehnt (30 Tage)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Übersicht — pending counts from all approval sources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Übersicht</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {approvalSources.map(source => (
            <Link
              key={source.href}
              href={source.href}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-gray-900 dark:text-white">{source.label}</span>
              <span className="flex items-center gap-2">
                <span className={`text-sm font-medium ${source.count > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {source.count} ausstehend
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </span>
            </Link>
          ))}
          {/* Inline submissions count */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-gray-900 dark:text-white">Allgemeine Einreichungen</span>
            <span className={`text-sm font-medium ${stats.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {stats.pending} ausstehend
            </span>
          </div>
        </div>
      </div>

      {/* Pending Items — inline list for user_content_submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ausstehende Freigaben</h2>
        </div>

        {pendingItems.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingItems.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contentTypeLabels[item.content_type] || item.content_type}
                    {' • '}{item.user_name || item.user_email}
                    {' • '}{formatDateShort(item.submitted_at)}
                  </p>
                  {item.summary && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.summary}</p>
                  )}
                </div>
                <ApprovalActions submissionId={item.id} title={item.title} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine ausstehenden Freigaben
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Alle eingereichten Inhalte wurden bearbeitet.
            </p>
          </div>
        )}
      </div>

      {/* Permission Requests (super admin only) */}
      {isSuper && (
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Berechtigungsanfragen
          </h2>
          <PermissionRequestsManager />
        </div>
      )}

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Workshop-Vorschläge und Blog-Artikel von Benutzern
          müssen hier geprüft und freigegeben werden, bevor sie öffentlich sichtbar sind.
          {isSuper && ' Berechtigungsanfragen von Teammitgliedern können nur von Super-Admins bearbeitet werden.'}
        </p>
      </div>
    </AdminPageWrapper>
  )
}
