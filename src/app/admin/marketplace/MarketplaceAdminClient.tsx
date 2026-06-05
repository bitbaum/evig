'use client'

import { AlertTriangle, Clock, Loader2, ArrowRight, ShoppingBag } from 'lucide-react'
import { useMarketplaceAdmin } from './useMarketplaceAdmin'
import { TABS } from './types'
import { ListingsTab } from './ListingsTab'
import { ReportsTab } from './ReportsTab'
import { OrdersTab } from './OrdersTab'
import { EditListingModal } from './EditListingModal'
import { HandleReportModal } from './HandleReportModal'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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

// ─── HeroStatus ─────────────────────────────────────────────────────────────
// Same anti-pattern fix as IT-Hilfe admin (TT.1): pick the single most-
// important next action based on system state instead of showing 4 cards
// of zeros. Severity ranks: open reports > unverified pending > all clear.
// ─────────────────────────────────────────────────────────────────────────────

interface HeroStatusProps {
  stats: MarketplaceStats
  onJumpTo: (tab: 'listings' | 'reports' | 'orders') => void
}

function HeroStatus({ stats, onJumpTo }: HeroStatusProps) {
  const activeListings = stats.byStatus.active ?? 0
  const unverified = stats.unverified
  const openReports = stats.openReports

  let icon: typeof AlertTriangle = ShoppingBag
  let tone: 'urgent' | 'attention' | 'healthy' = 'healthy'
  let headline = 'Marketplace im grünen Bereich.'
  let sub = `${activeListings} aktive Inserate, keine offenen Meldungen.`
  let ctaLabel: string | null = null
  let ctaTab: 'listings' | 'reports' | 'orders' | null = null

  if (openReports > 0) {
    tone = 'urgent'
    icon = AlertTriangle
    headline = `${openReports} offene Meldung${openReports === 1 ? '' : 'en'} prüfen`
    sub = 'Gemeldete Inserate brauchen eine Entscheidung — sonst sehen sie Käufer weiter.'
    ctaLabel = 'Meldungen ansehen'
    ctaTab = 'reports'
  } else if (unverified > 0) {
    tone = 'attention'
    icon = Clock
    headline = `${unverified} ungeprüfte Inserate`
    sub = 'Neue Einträge warten auf Freischaltung — bis dahin sind sie nicht öffentlich.'
    ctaLabel = 'Inserate prüfen'
    ctaTab = 'listings'
  }

  const toneClasses: Record<typeof tone, string> = {
    urgent: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800',
    attention: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
    healthy: 'bg-surface-raised border-subtle',
  }
  const iconClasses: Record<typeof tone, string> = {
    urgent: 'text-error-600 dark:text-error-400',
    attention: 'text-warning-600 dark:text-warning-400',
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
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary leading-tight">{headline}</h2>
          <p className="mt-1 text-sm text-text-secondary">{sub}</p>
        </div>
        {ctaLabel && ctaTab && (
          <Button onClick={() => onJumpTo(ctaTab!)} variant="primary" size="sm" className="shrink-0 inline-flex items-center gap-2">
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <KpiCell label="Aktiv" value={activeListings} />
        <KpiCell label="Ungeprüft" value={unverified} />
        <KpiCell label="Offene Meldungen" value={openReports} />
        <KpiCell label="RevampIT-Inserate" value={stats.revampit} />
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
