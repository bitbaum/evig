'use client'

import Link from 'next/link'
import { HelpCircle, Loader2, AlertTriangle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminHeroStatus, type HeroTone, type HeroKpi, type HeroCta } from '@/components/admin/AdminHeroStatus'
import { TABS } from './types'
import type { Stats } from './types'
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

/**
 * Compute the IT-Hilfe hero state from stats. Pure function — pulled
 * out of the render path so the same logic can be unit-tested. Order
 * matters: first matching condition wins.
 */
function deriveHeroState(stats: Stats, onJumpToRequests: () => void): {
  tone: HeroTone
  icon: typeof HelpCircle
  headline: string
  sub: string
  cta?: HeroCta
  kpis: HeroKpi[]
} {
  const openRequests = stats.byStatus.open ?? 0
  const urgentRequests = stats.byUrgency.urgent ?? 0
  const activeTechniker = stats.activeHelpers
  const verifiedTechniker = stats.verifiedHelpers
  const resolutionPct = stats.resolutionRate
  const REVIEW_APPLICATIONS_HREF = '/admin/repairer-applications'

  const kpis: HeroKpi[] = [
    { label: 'Offen', value: openRequests },
    { label: 'Aktive Techniker', value: activeTechniker },
    { label: 'Verifiziert', value: verifiedTechniker },
    { label: 'Lösungsrate', value: `${resolutionPct}%` },
  ]

  if (urgentRequests > 0) {
    return {
      tone: 'urgent',
      icon: AlertTriangle,
      headline: `${urgentRequests} dringende Anfrage${urgentRequests === 1 ? '' : 'n'} warten`,
      sub: 'Schnelle Reaktion verhindert, dass Hilfesuchende abspringen.',
      cta: { label: 'Dringende anzeigen', onClick: onJumpToRequests },
      kpis,
    }
  }
  if (openRequests > 0 && activeTechniker === 0) {
    return {
      tone: 'attention',
      icon: AlertTriangle,
      headline: `${openRequests} offene Anfrage${openRequests === 1 ? '' : 'n'}, aber keine aktiven Techniker`,
      sub: 'Bestätige Bewerbungen, damit jemand die Anfragen übernehmen kann.',
      cta: { label: 'Bewerbungen prüfen', href: REVIEW_APPLICATIONS_HREF },
      kpis,
    }
  }
  if (openRequests > 0) {
    return {
      tone: 'attention',
      icon: HelpCircle,
      headline: `${openRequests} offene Anfrage${openRequests === 1 ? '' : 'n'}`,
      sub: `${activeTechniker} aktive Techniker können sie übernehmen.`,
      cta: { label: 'Anfragen ansehen', onClick: onJumpToRequests },
      kpis,
    }
  }
  if (activeTechniker === 0) {
    return {
      tone: 'empty',
      icon: UserPlus,
      headline: 'Noch keine aktiven Techniker',
      sub: 'Aktiviere Bewerbungen, damit das System Anfragen entgegennehmen kann.',
      cta: { label: 'Bewerbungen prüfen', href: REVIEW_APPLICATIONS_HREF },
      kpis,
    }
  }
  return {
    tone: 'healthy',
    icon: HelpCircle,
    headline: 'Alles im grünen Bereich.',
    sub: `${stats.total} Anfragen insgesamt, ${resolutionPct}% gelöst.`,
    kpis,
  }
}

function HeroStatus({ stats, onJumpToRequests }: { stats: Stats; onJumpToRequests: () => void }) {
  const s = deriveHeroState(stats, onJumpToRequests)
  return (
    <AdminHeroStatus
      tone={s.tone}
      icon={s.icon}
      headline={s.headline}
      sub={s.sub}
      cta={s.cta}
      kpis={s.kpis}
    />
  )
}

export { deriveHeroState as __test__deriveHeroState }
