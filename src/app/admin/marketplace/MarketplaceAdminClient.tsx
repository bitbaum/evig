'use client'

import { Package, AlertTriangle, Clock, Store, Loader2 } from 'lucide-react'
import { useMarketplaceAdmin } from './useMarketplaceAdmin'
import { TABS } from './types'
import { StatsCard } from './StatsCard'
import { ListingsTab } from './ListingsTab'
import { ReportsTab } from './ReportsTab'
import { OrdersTab } from './OrdersTab'
import { EditListingModal } from './EditListingModal'
import { HandleReportModal } from './HandleReportModal'

export default function MarketplaceAdminClient() {
  const m = useMarketplaceAdmin()

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {m.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Aktive Inserate" value={m.stats.byStatus.active ?? 0} icon={Package} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
          <StatsCard label="Ungeprüft" value={m.stats.unverified} icon={Clock} color="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200" />
          <StatsCard label="Offene Meldungen" value={m.stats.openReports} icon={AlertTriangle} color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" />
          <StatsCard label="Revamp-IT" value={m.stats.revampit} icon={Store} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => m.switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              m.tab === t.id
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'reports' && m.stats && m.stats.openReports > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {m.stats.openReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {m.loading && !m.listings && !m.reports && !m.orders ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
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
    </div>
  )
}
