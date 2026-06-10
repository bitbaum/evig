'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
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

type ITHilfeTranslator = ReturnType<typeof useTranslations>

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
  const t = useTranslations('admin.itHilfe')
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
      {stats && <HeroStatus stats={stats} onJumpToRequests={() => switchTab('requests')} t={t} />}

      {/* Tab Navigation + per-tab primary CTA */}
      <div className="flex items-center justify-between gap-4 border-b border">
        <div className="flex gap-1">
          {TABS.map(tabDef => (
            <Button
              key={tabDef.id}
              variant="ghost"
              size="sm"
              onClick={() => switchTab(tabDef.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tabDef.id
                  ? 'border-action text-action'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <tabDef.icon className="w-4 h-4" />
              {t(`tabs.${tabDef.labelKey}`)}
            </Button>
          ))}
        </div>
        {tab === 'helpers' && (
          <Button as={Link} href="/admin/repairer-applications" variant="primary" size="sm" className="mb-2 inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {t('topActions.reviewApplications')}
          </Button>
        )}
        {tab === 'requests' && (
          <Button as={Link} href="/it-hilfe/create" variant="outline" size="sm" className="mb-2 inline-flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {t('topActions.newRequest')}
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
 *
 * Takes a translator (admin.itHilfe namespace) so strings are localized
 * at the call site rather than hardcoded.
 */
function deriveHeroState(stats: Stats, onJumpToRequests: () => void, t: ITHilfeTranslator): {
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
    { label: t('hero.kpis.open'), value: openRequests },
    { label: t('hero.kpis.activeTechniker'), value: activeTechniker },
    { label: t('hero.kpis.verified'), value: verifiedTechniker },
    { label: t('hero.kpis.resolutionRate'), value: `${resolutionPct}%` },
  ]

  if (urgentRequests > 0) {
    return {
      tone: 'urgent',
      icon: AlertTriangle,
      headline: t('hero.urgent.headline', { count: urgentRequests }),
      sub: t('hero.urgent.sub'),
      cta: { label: t('hero.urgent.cta'), onClick: onJumpToRequests },
      kpis,
    }
  }
  if (openRequests > 0 && activeTechniker === 0) {
    return {
      tone: 'attention',
      icon: AlertTriangle,
      headline: t('hero.openNoTechniker.headline', { count: openRequests }),
      sub: t('hero.openNoTechniker.sub'),
      cta: { label: t('hero.openNoTechniker.cta'), href: REVIEW_APPLICATIONS_HREF },
      kpis,
    }
  }
  if (openRequests > 0) {
    return {
      tone: 'attention',
      icon: HelpCircle,
      headline: t('hero.openWithTechniker.headline', { count: openRequests }),
      sub: t('hero.openWithTechniker.sub', { technikerCount: activeTechniker }),
      cta: { label: t('hero.openWithTechniker.cta'), onClick: onJumpToRequests },
      kpis,
    }
  }
  if (activeTechniker === 0) {
    return {
      tone: 'empty',
      icon: UserPlus,
      headline: t('hero.noTechniker.headline'),
      sub: t('hero.noTechniker.sub'),
      cta: { label: t('hero.noTechniker.cta'), href: REVIEW_APPLICATIONS_HREF },
      kpis,
    }
  }
  return {
    tone: 'healthy',
    icon: HelpCircle,
    headline: t('hero.healthy.headline'),
    sub: t('hero.healthy.sub', { total: stats.total, percent: resolutionPct }),
    kpis,
  }
}

function HeroStatus({ stats, onJumpToRequests, t }: { stats: Stats; onJumpToRequests: () => void; t: ITHilfeTranslator }) {
  const s = deriveHeroState(stats, onJumpToRequests, t)
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
