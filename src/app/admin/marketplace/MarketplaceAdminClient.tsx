'use client'

import { Package, AlertTriangle, Clock, Store, Loader2 } from 'lucide-react'
import { ORG } from '@/config/org'
import { useMarketplaceAdmin } from './useMarketplaceAdmin'
import { TABS } from './types'
import { StatsCard } from './StatsCard'
import { ListingsTab } from './ListingsTab'
import { ReportsTab } from './ReportsTab'
import { OrdersTab } from './OrdersTab'
import { EditListingModal } from './EditListingModal'
import { HandleReportModal } from './HandleReportModal'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function MarketplaceAdminClient() {
  const m = useMarketplaceAdmin()

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {m.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Aktive Inserate" value={m.stats.byStatus.active ?? 0} icon={Package} color="bg-action-muted border-strong text-action-text" />
          <StatsCard label="Ungeprüft" value={m.stats.unverified} icon={Clock} color="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200" />
          <StatsCard label="Offene Meldungen" value={m.stats.openReports} icon={AlertTriangle} color="bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200" />
          <StatsCard label={ORG.name} value={m.stats.revampit} icon={Store} color="bg-action-muted border-strong text-action-text" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border">
        {TABS.map(t => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => m.switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
