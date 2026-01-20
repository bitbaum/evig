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
import { CheckSquare, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'

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

async function getApprovalStats(): Promise<ApprovalStats> {
  try {
    // Get pending count
    const pendingResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_content_submissions WHERE status = 'pending'`
    )
    const pending = parseInt(pendingResult.rows[0]?.count || '0')

    // Get approved count (last 30 days)
    const approvedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_content_submissions
       WHERE status = 'approved'
       AND reviewed_at >= NOW() - INTERVAL '30 days'`
    )
    const approved = parseInt(approvedResult.rows[0]?.count || '0')

    // Get rejected count (last 30 days)
    const rejectedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_content_submissions
       WHERE status = 'rejected'
       AND reviewed_at >= NOW() - INTERVAL '30 days'`
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
       FROM user_content_submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'pending'
       ORDER BY s.submitted_at DESC
       LIMIT 50`
    )
    return result.rows
  } catch {
    // Table might not exist yet
    return []
  }
}

const contentTypeLabels: Record<string, string> = {
  product: 'Produkt',
  service: 'Dienstleistung',
  workshop: 'Workshop',
  blog_post: 'Blog-Artikel',
}

export default async function ApprovalsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/approvals')
  }

  const [stats, pendingItems] = await Promise.all([
    getApprovalStats(),
    getPendingSubmissions(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Freigaben
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Eingereichte Inhalte von Benutzern prüfen und freigeben
          </p>
        </div>
      </div>

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

      {/* Pending Items */}
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
                    {' • '}{new Date(item.submitted_at).toLocaleDateString('de-CH')}
                  </p>
                  {item.summary && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{item.summary}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                    Genehmigen
                  </button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                    Ablehnen
                  </button>
                </div>
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

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Alle von Benutzern eingereichten Inhalte (Produkte, Workshops, Dienstleistungen, Blog-Artikel)
          müssen hier geprüft und freigegeben werden, bevor sie öffentlich sichtbar sind.
        </p>
      </div>
    </div>
  )
}
