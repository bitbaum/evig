'use client'

import Link from 'next/link'
import { HelpCircle, Users, Loader2, AlertTriangle, UserPlus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TABS } from './types'
import { useITHilfeAdmin } from './useITHilfeAdmin'
import { RequestsTab } from './RequestsTab'
import { HelpersTab } from './HelpersTab'
import { EditRequestModal } from './EditRequestModal'
import { HelperActionModal } from './HelperActionModal'

/**
 * IT-Hilfe Admin landing — TT.1 redesign.
 *
 * What changed:
 *   - The 4 "0 / 0 / 0 / 0%" stat cards are gone. They had no contrast
 *     (white-on-light-green) AND no point (zeros don't tell you what to
 *     do next). Replaced with a single hero status that surfaces the
 *     *next action* — urgent requests, request-without-technicians,
 *     empty state, or healthy.
 *   - Terminology: every user-facing string says "Techniker" (RevampIT's
 *     established term for the community helpers). The internal table
 *     `helpers` keeps its name; only display strings normalize.
 *   - Each tab has a clear primary CTA in the top-right.
 */
export default function ITHilfeAdminClient() {
  const {
    tab, switchTab,
    stats,
    requests, reqFilter, setReqFilter, reqOffset, setReqOffset,
    helpers, helpFilter, setHelpFilter, helpOffset, setHelpOffset,
    editId, editData, setEditData, editLoading, openEditModal, closeEditModal, handleEditSave,
    actionHelperId, helperAction, helperNotes, setHelperNotes, actionLoading,
    openHelperAction, closeHelperAction, handleHelperAction,
    loading,
  } = useITHilfeAdmin()

  return (
    <div className="space-y-6">
      {/* Hero status — single clear next action per state */}
      {stats && <HeroStatus stats={stats} onJumpToRequests={() => switchTab('requests')} />}

      {/* Tab Navigation + per-tab primary CTA */}
      <div className="flex items-center justify-between gap-4 border-b border">
        <div className="flex gap-1">
          {TABS.map(t => (
            <Button
              key={t.id}
              variant="ghost"
              size="sm"
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-action text-action'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Button>
          ))}
        </div>
        {tab === 'helpers' && (
          <Button as={Link} href="/admin/repairer-applications" variant="primary" size="sm" className="mb-2 inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Bewerbungen prüfen
          </Button>
        )}
        {tab === 'requests' && (
          <Button as={Link} href="/it-hilfe/create" variant="outline" size="sm" className="mb-2 inline-flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Neue Anfrage
          </Button>
        )}
      </div>

      {/* Tab Content */}
      {loading && !requests && !helpers ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {tab === 'requests' && (
            <RequestsTab
              requests={requests}
              reqFilter={reqFilter}
              setReqFilter={setReqFilter}
              reqOffset={reqOffset}
              setReqOffset={setReqOffset}
              onEdit={openEditModal}
            />
          )}

          {tab === 'helpers' && (
            <HelpersTab
              helpers={helpers}
              helpFilter={helpFilter}
              setHelpFilter={setHelpFilter}
              helpOffset={helpOffset}
              setHelpOffset={setHelpOffset}
              stats={stats}
              onAction={openHelperAction}
            />
          )}
        </>
      )}

      {/* Edit Request Modal */}
      {editId && (
        <EditRequestModal
          editData={editData}
          setEditData={setEditData}
          editLoading={editLoading}
          onSave={handleEditSave}
          onClose={closeEditModal}
        />
      )}

      {/* Helper Action Modal */}
      {actionHelperId && (
        <HelperActionModal
          helperAction={helperAction}
          helperNotes={helperNotes}
          setHelperNotes={setHelperNotes}
          actionLoading={actionLoading}
          onConfirm={handleHelperAction}
          onClose={closeHelperAction}
        />
      )}
    </div>
  )
}

// ─── HeroStatus ─────────────────────────────────────────────────────────────
// Pick the one thing the admin should do next, based on system state.
// Order matters — first matching condition wins. Each state has:
//   - a primary CTA (clear next action)
//   - secondary KPI strip (the numbers, but small + after the headline)
// Never shows 4 dead-zero cards.
// ─────────────────────────────────────────────────────────────────────────────

interface HeroStatusProps {
  stats: import('./types').Stats
  onJumpToRequests: () => void
}

function HeroStatus({ stats, onJumpToRequests }: HeroStatusProps) {
  const openRequests = stats.byStatus.open ?? 0
  const urgentRequests = stats.byUrgency.urgent ?? 0
  const activeTechniker = stats.activeHelpers
  const verifiedTechniker = stats.verifiedHelpers
  const resolutionPct = stats.resolutionRate

  // Decide the headline
  let icon: typeof HelpCircle = HelpCircle
  let tone: 'urgent' | 'attention' | 'empty' | 'healthy' = 'healthy'
  let headline = 'Alles im grünen Bereich.'
  let sub = `${stats.total} Anfragen insgesamt, ${resolutionPct}% gelöst.`
  let ctaLabel: string | null = null
  let ctaAction: (() => void) | null = null

  if (urgentRequests > 0) {
    tone = 'urgent'
    icon = AlertTriangle
    headline = `${urgentRequests} dringende Anfrage${urgentRequests === 1 ? '' : 'n'} warten`
    sub = `Schnelle Reaktion verhindert, dass Hilfesuchende abspringen.`
    ctaLabel = 'Dringende anzeigen'
    ctaAction = onJumpToRequests
  } else if (openRequests > 0 && activeTechniker === 0) {
    tone = 'attention'
    icon = AlertTriangle
    headline = `${openRequests} offene Anfrage${openRequests === 1 ? '' : 'n'}, aber keine aktiven Techniker`
    sub = 'Bestätige Bewerbungen, damit jemand die Anfragen übernehmen kann.'
    ctaLabel = 'Bewerbungen prüfen'
    ctaAction = null  // Link via separate href below
  } else if (openRequests > 0) {
    tone = 'attention'
    icon = HelpCircle
    headline = `${openRequests} offene Anfrage${openRequests === 1 ? '' : 'n'}`
    sub = `${activeTechniker} aktive Techniker können sie übernehmen.`
    ctaLabel = 'Anfragen ansehen'
    ctaAction = onJumpToRequests
  } else if (activeTechniker === 0) {
    tone = 'empty'
    icon = UserPlus
    headline = 'Noch keine aktiven Techniker'
    sub = 'Aktiviere Bewerbungen, damit das System Anfragen entgegennehmen kann.'
    ctaLabel = 'Bewerbungen prüfen'
    ctaAction = null  // Link via separate href
  }

  const toneClasses: Record<typeof tone, string> = {
    urgent: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800',
    attention: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
    empty: 'bg-surface-raised border-strong',
    healthy: 'bg-surface-raised border-subtle',
  }
  const iconClasses: Record<typeof tone, string> = {
    urgent: 'text-error-600 dark:text-error-400',
    attention: 'text-warning-600 dark:text-warning-400',
    empty: 'text-text-tertiary',
    healthy: 'text-action',
  }

  const Icon = icon

  return (
    <div className={`rounded-xl border p-5 sm:p-6 ${toneClasses[tone]}`}>
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-lg p-2 bg-surface-base/60 dark:bg-surface-base/30 ${iconClasses[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary leading-tight">
            {headline}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{sub}</p>
        </div>
        {ctaLabel && (
          ctaAction ? (
            <Button onClick={ctaAction} variant="primary" size="sm" className="shrink-0 inline-flex items-center gap-2">
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button as={Link} href="/admin/repairer-applications" variant="primary" size="sm" className="shrink-0 inline-flex items-center gap-2">
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )
        )}
      </div>

      {/* Secondary KPI strip — small, monospaced, contextual */}
      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <KpiCell label="Offen" value={openRequests} />
        <KpiCell label="Aktive Techniker" value={activeTechniker} />
        <KpiCell label="Verifiziert" value={verifiedTechniker} />
        <KpiCell label="Lösungsrate" value={`${resolutionPct}%`} />
      </dl>
    </div>
  )
}

function KpiCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="font-mono font-medium tabular-nums text-text-primary">{value}</dd>
    </div>
  )
}
