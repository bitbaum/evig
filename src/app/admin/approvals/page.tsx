/**
 * Admin Approvals ("Freigaben") landing.
 *
 * Pending counts come from ONE engine — `getApprovalCounts()` over the
 * APPROVAL_SOURCES SSOT (live tables only). The former double-count (live
 * sources + the dead `user_content_submissions` table) is gone, as is that
 * dead table's namesake queue.
 *
 * Act-here sources (workshop proposals, locations, permission requests) render
 * inline; act-elsewhere sources (blog article review, timecards/absences) are
 * link-outs with live counts. Per the SSOT `reviewMode`.
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CheckSquare, Shield, ExternalLink } from 'lucide-react'
import { AdminHeroStatus, type HeroTone, type HeroKpi } from '@/components/admin/AdminHeroStatus'
import { isSuperAdmin } from '@/lib/permissions'
import { ApprovalTabs } from '@/components/admin/approvals/ApprovalTabs'
import { WorkshopProposalsSection } from '@/components/admin/approvals/WorkshopProposalsSection'
import { LocationApprovalsSection } from '@/components/admin/approvals/LocationApprovalsSection'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Link from 'next/link'
import Heading from '@/components/admin/AdminHeading'
import { StatusBadge } from '@/components/ui/status-badge'
import { adminInteractive } from '@/lib/admin-ui'
import { APPROVAL_SOURCES } from '@/config/approval-sources'
import { getApprovalCounts, totalPending, oldestPendingAt, type ApprovalCount } from '@/lib/approvals/counts'

export const metadata: Metadata = {
  title: 'Freigaben',
  description: 'Eingereichte Inhalte prüfen und freigeben.',
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24))
}

function ApprovalsHero({ pending, oldestPendingDays }: { pending: number; oldestPendingDays: number | null }) {
  const kpis: HeroKpi[] = [
    { label: 'Ausstehend', value: pending },
    { label: 'Ältestes', value: oldestPendingDays === null ? '—' : `${oldestPendingDays}T` },
  ]

  if (pending === 0) {
    return (
      <AdminHeroStatus
        tone="healthy"
        icon="check"
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
    : 'Eingereichte Beiträge brauchen eine Entscheidung, damit sie wirksam werden.'

  return (
    <AdminHeroStatus
      tone={tone}
      icon="clock"
      headline={pending === 1 ? '1 Freigabe wartet' : `${pending} Freigaben warten`}
      sub={sub}
      kpis={kpis}
    />
  )
}

function StalenessBadge({ count }: { count: ApprovalCount }) {
  if (count.failed) return <StatusBadge variant="error">Zählung fehlgeschlagen</StatusBadge>
  const days = daysSince(count.oldestAt)
  if (days !== null && days >= 7) return <StatusBadge variant="error">{days}+ Tage</StatusBadge>
  if (days !== null && days >= 3) return <StatusBadge variant="warning">{days}+ Tage</StatusBadge>
  return null
}

export default async function ApprovalsPage() {
  const t = await getTranslations('admin.approvals')
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/approvals')
  }

  const isSuper = isSuperAdmin(session.user.email)

  const counts = await getApprovalCounts()
  const total = totalPending(counts)
  const oldestDays = daysSince(oldestPendingAt(counts))

  // Link-out sources = anything not actioned inline on this page (blog needs the
  // full article; timecards/absences live on the bulk tab). SSOT `reviewMode`.
  const linkOutSources = APPROVAL_SOURCES.filter(s => s.reviewMode !== 'inline')

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={CheckSquare}
      iconColor="green"
    >
      <ApprovalTabs />

      <ApprovalsHero pending={total} oldestPendingDays={oldestDays} />

      {/* Act-here queues — call the same domain APIs as their full pages, so
          every transaction/email/audit side effect stays intact. Each renders
          nothing when empty. */}
      <WorkshopProposalsSection />
      <LocationApprovalsSection />

      {/* Act-elsewhere sources — live counts, link to the right surface. */}
      <div className="bg-surface-base rounded-xl border border-subtle">
        <div className="p-4 border-b border-subtle">
          <Heading level={2} className="font-semibold text-text-primary">Weitere Freigaben</Heading>
        </div>
        <div className="divide-y divide-subtle">
          {linkOutSources.map(source => {
            const count = counts[source.key] ?? { pending: 0, oldestAt: null, failed: false }
            return (
              <Link
                key={source.key}
                href={source.reviewHref}
                className={`p-4 flex flex-wrap items-center justify-between gap-2 ${adminInteractive.rowHover} transition-colors`}
              >
                <span className="min-w-0 text-text-primary">{source.label}</span>
                <span className="flex items-center gap-2">
                  <StalenessBadge count={count} />
                  {!count.failed && (
                    <span className={`text-sm font-medium ${count.pending > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-text-muted'}`}>
                      {count.pending} ausstehend
                    </span>
                  )}
                  <ExternalLink className="w-4 h-4 shrink-0 text-text-muted" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Permission requests (super admin only) */}
      {isSuper && (
        <div>
          <Heading level={2} className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
            Berechtigungsanfragen
          </Heading>
          <PermissionRequestsManager />
        </div>
      )}

      <div className="p-6 bg-surface-raised border border-subtle rounded-xl">
        <p className="text-sm text-text-secondary">
          <strong>Hinweis:</strong> Workshop-Vorschläge und Blog-Artikel von Mitgliedern
          müssen hier geprüft und freigegeben werden, bevor sie öffentlich sichtbar sind.
          {isSuper && ' Berechtigungsanfragen von Teammitgliedern können nur von Super-Admins bearbeitet werden.'}
        </p>
      </div>
    </AdminPageWrapper>
  )
}
