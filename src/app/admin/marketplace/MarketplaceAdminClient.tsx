'use client'

import { useTranslations } from 'next-intl'
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

type MarketplaceTranslator = ReturnType<typeof useTranslations>

export default function MarketplaceAdminClient() {
  const t = useTranslations('admin.marketplace')
  const m = useMarketplaceAdmin()

  return (
    <div className="space-y-6">
      {/* Hero status — surfaces the next action, not 4 dead numbers */}
      {m.stats && <HeroStatus stats={m.stats} onJumpTo={m.switchTab} t={t} />}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border">
        {TABS.map(tabDef => (
          <Button
            key={tabDef.id}
            variant="ghost"
            size="sm"
            onClick={() => m.switchTab(tabDef.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              m.tab === tabDef.id
                ? 'border-action text-action'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <tabDef.icon className="w-4 h-4" />
            {t(`tabs.${tabDef.labelKey}`)}
            {tabDef.id === 'reports' && m.stats && m.stats.openReports > 0 && (
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
        title={t('listings.removeConfirm.title')}
        message={t('listings.removeConfirm.message', { title: m.pendingRemove?.title ?? '' })}
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
  t: MarketplaceTranslator,
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
    { label: t('hero.kpis.active'), value: activeListings },
    { label: t('hero.kpis.unverified'), value: unverified },
    { label: t('hero.kpis.openReports'), value: openReports },
    { label: t('hero.kpis.revampit'), value: stats.revampit },
  ]

  if (openReports > 0) {
    return {
      tone: 'urgent',
      icon: AlertTriangle,
      headline: t('hero.urgent.headline', { count: openReports }),
      sub: t('hero.urgent.sub'),
      cta: { label: t('hero.urgent.cta'), onClick: () => onJumpTo('reports') },
      kpis,
    }
  }
  if (unverified > 0) {
    return {
      tone: 'attention',
      icon: Clock,
      headline: t('hero.attention.headline', { count: unverified }),
      sub: t('hero.attention.sub'),
      cta: { label: t('hero.attention.cta'), onClick: () => onJumpTo('listings') },
      kpis,
    }
  }
  return {
    tone: 'healthy',
    icon: ShoppingBag,
    headline: t('hero.healthy.headline'),
    sub: t('hero.healthy.sub', { active: activeListings }),
    kpis,
  }
}

function HeroStatus({
  stats,
  onJumpTo,
  t,
}: {
  stats: MarketplaceStats
  onJumpTo: (tab: MarketplaceTab) => void
  t: MarketplaceTranslator
}) {
  const s = deriveHeroState(stats, onJumpTo, t)
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
