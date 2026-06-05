'use client'

import { AlertTriangle, Clock, Loader2, ShoppingBag } from 'lucide-react'
import { useMarketplaceAdmin } from './useMarketplaceAdmin'
import { TABS } from './types'
import { ListingsTab } from './ListingsTab'
import { ReportsTab } from './ReportsTab'
import { OrdersTab } from './OrdersTab'
import { EditListingModal } from './EditListingModal'
import { HandleReportModal } from './HandleReportModal'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdminHeroStatus, type HeroTone, type HeroKpi, type HeroCta } from '@/components/admin/AdminHeroStatus'
import type { Stats as MarketplaceStats } from './types'

export default function MarketplaceAdminClient() {
  const m = useMarketplaceAdmin()

  return (
    <div className="space-y-6">
      {/* Hero status — surfaces the next action, not 4 dead numbers */}
      {m.stats && <HeroStatus stats={m.stats} onJumpTo={m.switchTab} />}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border">
        {TABS.map(t => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => m.switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              m.tab === t.id
                ? 'border-action text-action'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'reports' && m.stats && m.stats.openReports > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300">
                {m.stats.openReports}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {m.loading && !m.listings && !m.reports && !m.orders ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
        </div>
      ) : (
        <>
          {m.tab === 'listings' && (
            <ListingsTab
              listings={m.listings}
              filter={m.listingsFilter}
              setFilter={m.setListingsFilter}
              offset={m.listingsOffset}
              setOffset={m.setListingsOffset}
              onEdit={m.openEditModal}
              onRemove={m.handleRemove}
            />
          )}

          {m.tab === 'reports' && (
            <ReportsTab
              reports={m.reports}
              filter={m.reportsFilter}
              setFilter={m.setReportsFilter}
              offset={m.reportsOffset}
              setOffset={m.setReportsOffset}
              onHandle={m.openReportModal}
            />
          )}

          {m.tab === 'orders' && (
            <OrdersTab
              orders={m.orders}
              filter={m.ordersFilter}
              setFilter={m.setOrdersFilter}
              offset={m.ordersOffset}
              setOffset={m.setOrdersOffset}
            />
          )}
        </>
      )}

      {/* Modals */}
      {m.editId && (
        <EditListingModal
          editData={m.editData}
          setEditData={m.setEditData}
          editLoading={m.editLoading}
          onSave={m.handleEditSave}
          onClose={m.closeEditModal}
        />
      )}

      {m.handlingReportId && (
        <HandleReportModal
          reportAction={m.reportAction}
          setReportAction={m.setReportAction}
          reportNotes={m.reportNotes}
          setReportNotes={m.setReportNotes}
          reportLoading={m.reportLoading}
          onSubmit={m.handleReport}
          onClose={m.closeReportModal}
        />
      )}

      <ConfirmDialog
        isOpen={!!m.pendingRemove}
        title="Inserat entfernen"
        message={`Inserat "${m.pendingRemove?.title}" wirklich entfernen?`}
        onConfirm={m.doRemove}
        onClose={m.cancelRemove}
      />
    </div>
  )
}

type MarketplaceTab = 'listings' | 'reports' | 'orders'

/**
 * Compute the Marketplace hero state from stats. Pure function.
 * Severity rank: open reports > unverified pending > healthy.
 */
function deriveHeroState(
  stats: MarketplaceStats,
  onJumpTo: (tab: MarketplaceTab) => void,
): {
  tone: HeroTone
  icon: typeof AlertTriangle
  headline: string
  sub: string
  cta?: HeroCta
  kpis: HeroKpi[]
} {
  const activeListings = stats.byStatus.active ?? 0
  const unverified = stats.unverified
  const openReports = stats.openReports

  const kpis: HeroKpi[] = [
    { label: 'Aktiv', value: activeListings },
    { label: 'Ungeprüft', value: unverified },
    { label: 'Offene Meldungen', value: openReports },
    { label: 'RevampIT-Inserate', value: stats.revampit },
  ]

  if (openReports > 0) {
    return {
      tone: 'urgent',
      icon: AlertTriangle,
      headline: `${openReports} offene Meldung${openReports === 1 ? '' : 'en'} prüfen`,
      sub: 'Gemeldete Inserate brauchen eine Entscheidung — sonst sehen sie Käufer weiter.',
      cta: { label: 'Meldungen ansehen', onClick: () => onJumpTo('reports') },
      kpis,
    }
  }
  if (unverified > 0) {
    return {
      tone: 'attention',
      icon: Clock,
      headline: `${unverified} ungeprüfte Inserate`,
      sub: 'Neue Einträge warten auf Freischaltung — bis dahin sind sie nicht öffentlich.',
      cta: { label: 'Inserate prüfen', onClick: () => onJumpTo('listings') },
      kpis,
    }
  }
  return {
    tone: 'healthy',
    icon: ShoppingBag,
    headline: 'Marketplace im grünen Bereich.',
    sub: `${activeListings} aktive Inserate, keine offenen Meldungen.`,
    kpis,
  }
}

function HeroStatus({
  stats,
  onJumpTo,
}: {
  stats: MarketplaceStats
  onJumpTo: (tab: MarketplaceTab) => void
}) {
  const s = deriveHeroState(stats, onJumpTo)
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
