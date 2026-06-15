/**
 * Admin Approvals Page - Server Component
 *
 * Shows pending user content submissions that need admin approval.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { CheckSquare, Clock, CheckCircle2, FileText, Shield, ExternalLink } from 'lucide-react'
import { AdminHeroStatus, type HeroTone, type HeroKpi } from '@/components/admin/AdminHeroStatus'
import { APPROVAL_STATUS, SUBMISSION_CONTENT_TYPE, SUBMISSION_CONTENT_TYPE_LABELS } from '@/config/approval-status'
import { formatDateShort } from '@/lib/date-formats'
import { isSuperAdmin } from '@/lib/permissions'
import { ApprovalActions } from './ApprovalActions'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Link from 'next/link'
import Heading from '@/components/admin/AdminHeading'
import { logger } from '@/lib/logger'
import { StatusBadge } from '@/components/ui/status-badge'
import { adminInteractive } from '@/lib/admin-ui'

const APPROVAL_CONTENT_TYPES = [SUBMISSION_CONTENT_TYPE.WORKSHOP, SUBMISSION_CONTENT_TYPE.BLOG_POST]

export const metadata: Metadata = {
  title: 'Freigaben',
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
  oldestPendingDays: number | null
}

async function getApprovalSourceCounts(): Promise<ApprovalSource[]> {
  const sources: ApprovalSource[] = []

  const queries = [
    {
      label: 'Blog-Beiträge',
      href: '/admin/content/submissions',
      sql: `SELECT COUNT(*) as count, MIN(created_at) as oldest FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE status = '${APPROVAL_STATUS.PENDING}'`,
    },
    {
      label: 'Workshop-Vorschläge',
      href: '/admin/workshops',
      sql: `SELECT COUNT(*) as count, MIN(created_at) as oldest FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} WHERE status = '${APPROVAL_STATUS.PENDING}'`,
    },
    {
      label: 'Techniker-Bewerbungen',
      href: '/admin/repairer-applications',
      sql: `SELECT COUNT(*) as count, MIN(created_at) as oldest FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} WHERE status = '${APPROVAL_STATUS.PENDING}'`,
    },
    {
      label: 'Standorte',
      href: '/admin/locations',
      sql: `SELECT COUNT(*) as count, MIN(created_at) as oldest FROM ${TABLE_NAMES.LOCATIONS} WHERE approval_status = '${APPROVAL_STATUS.PENDING}'`,
    },
  ]

  for (const q of queries) {
    try {
      const result = await query<{ count: string; oldest: string | null }>(q.sql)
      const count = parseInt(result.rows[0]?.count || '0')
      const oldest = result.rows[0]?.oldest
      const oldestPendingDays = oldest && count > 0
        ? Math.floor((Date.now() - new Date(oldest).getTime()) / (1000 * 60 * 60 * 24))
        : null
      sources.push({ label: q.label, count, href: q.href, oldestPendingDays })
    } catch {
      // Table might not exist yet
      sources.push({ label: q.label, count: 0, href: q.href, oldestPendingDays: null })
    }
  }

  return sources
}

async function getApprovalStats(): Promise<ApprovalStats> {
  try {
    const allowedTypes = APPROVAL_CONTENT_TYPES

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
    const allowedTypes = APPROVAL_CONTENT_TYPES
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

const contentTypeLabels: Record<string, string> = SUBMISSION_CONTENT_TYPE_LABELS

/**
 * Hero status for the approvals landing. The Übersicht list directly
 * below is the actual call-to-action surface — admin clicks a source
 * to triage. The hero just names "how much is waiting" and how stale
 * the oldest entry is, so urgency is signaled before scrolling.
 */
function ApprovalsHero({
  pending,
  approved,
  rejected,
  oldestPendingDays,
}: {
  pending: number
  approved: number
  rejected: number
  oldestPendingDays: number | null
}) {
  const kpis: HeroKpi[] = [
    { label: 'Ausstehend', value: pending },
    { label: 'Genehmigt (30T)', value: approved },
    { label: 'Abgelehnt (30T)', value: rejected },
    { label: 'Ältestes', value: oldestPendingDays === null ? '—' : `${oldestPendingDays}T` },
  ]

  if (pending === 0) {
    return (
      <AdminHeroStatus
        tone="healthy"
        icon={CheckCircle2}
        headline="Keine offenen Freigaben."
        sub="Sobald jemand etwas einreicht, taucht es hier auf."
        kpis={kpis}
      />
    )
  }

  const urgent = (oldestPendingDays ?? 0) >= 7
  const tone: HeroTone = urgent ? 'urgent' : 'attention'
  const sub = urgent
    ? `Älteste Einreichung wartet seit ${oldestPendingDays} Tagen — Einreichende werden nervös.`
    : 'Eingereichte Inhalte brauchen eine Entscheidung, damit sie öffentlich werden.'

  return (
    <AdminHeroStatus
      tone={tone}
      icon={Clock}
      headline={`${pending} Inhalt${pending === 1 ? '' : 'e'} warten auf Freigabe`}
      sub={sub}
      kpis={kpis}
    />
  )
}

export default async function ApprovalsPage() {
  const t = await getTranslations('admin.approvals')
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
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={CheckSquare}
      iconColor="orange"
    >
      {/* Hero status — surfaces the actual headline + actionable list below */}
      <ApprovalsHero
        pending={totalPendingAllSources}
        approved={stats.approved}
        rejected={stats.rejected}
        oldestPendingDays={
          approvalSources.reduce<number | null>((max, s) => {
            if (s.oldestPendingDays === null) return max
            return max === null ? s.oldestPendingDays : Math.max(max, s.oldestPendingDays)
          }, null)
        }
      />

      {/* Übersicht — pending counts from all approval sources */}
      <div className="bg-surface-base rounded-xl border border">
        <div className="p-4 border-b border">
          <Heading level={2} className="font-semibold text-text-primary">Übersicht</Heading>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-white/4">
          {approvalSources.map(source => (
            <Link
              key={source.href}
              href={source.href}
              className={`p-4 flex items-center justify-between ${adminInteractive.rowHover} transition-colors`}
            >
              <span className="text-text-primary">{source.label}</span>
              <span className="flex items-center gap-2">
                {source.oldestPendingDays !== null && source.oldestPendingDays >= 7 && (
                  <StatusBadge variant="error">
                    {source.oldestPendingDays}+ Tage
                  </StatusBadge>
                )}
                {source.oldestPendingDays !== null && source.oldestPendingDays >= 3 && source.oldestPendingDays < 7 && (
                  <StatusBadge variant="warning">
                    {source.oldestPendingDays}+ Tage
                  </StatusBadge>
                )}
                <span className={`text-sm font-medium ${source.count > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-text-muted'}`}>
                  {source.count} ausstehend
                </span>
                <ExternalLink className="w-4 h-4 text-text-muted" />
              </span>
            </Link>
          ))}
          {/* Inline submissions count */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-text-primary">Allgemeine Einreichungen</span>
            <span className={`text-sm font-medium ${stats.pending > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-text-muted'}`}>
              {stats.pending} ausstehend
            </span>
          </div>
        </div>
      </div>

      {/* Pending Items — inline list for user_content_submissions */}
      <div className="bg-surface-base rounded-xl border border">
        <div className="p-4 border-b border">
          <Heading level={2} className="font-semibold text-text-primary">Ausstehende Freigaben</Heading>
        </div>

        {pendingItems.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-white/4">
            {pendingItems.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="text-sm text-text-tertiary">
                    {contentTypeLabels[item.content_type] || item.content_type}
                    {' • '}{item.user_name || item.user_email}
                    {' • '}{formatDateShort(item.submitted_at)}
                  </p>
                  {item.summary && (
                    <p className="text-sm text-text-tertiary mt-1 line-clamp-1">{item.summary}</p>
                  )}
                </div>
                <ApprovalActions submissionId={item.id} title={item.title} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
              Keine ausstehenden Freigaben
            </Heading>
            <p className="text-text-tertiary">
              Alle eingereichten Inhalte wurden bearbeitet.
            </p>
          </div>
        )}
      </div>

      {/* Permission Requests (super admin only) */}
      {isSuper && (
        <div>
          <Heading level={2} className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary-500" />
            Berechtigungsanfragen
          </Heading>
          <PermissionRequestsManager />
        </div>
      )}

      <div className="p-6 bg-surface-raised border border rounded-xl">
        <p className="text-sm text-text-secondary">
          <strong>Hinweis:</strong> Workshop-Vorschläge und Blog-Artikel von Benutzern
          müssen hier geprüft und freigegeben werden, bevor sie öffentlich sichtbar sind.
          {isSuper && ' Berechtigungsanfragen von Teammitgliedern können nur von Super-Admins bearbeitet werden.'}
        </p>
      </div>
    </AdminPageWrapper>
  )
}
