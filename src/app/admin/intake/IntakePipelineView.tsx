'use client'

import {
  Plus, Search, Filter, Check, Package,
} from 'lucide-react'
import {
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  getIntakeTierOptions,
} from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { INTAKE_STATUS, INTAKE_STATUS_LABELS } from '@/config/intake-status'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateShort } from '@/lib/date-formats'
import type { PipelineItem } from './types'

interface IntakePipelineViewProps {
  items: PipelineItem[]
  loading: boolean
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  statusCounts: { inProgress: number; ready: number; published: number; total: number }
  tierFilter: string
  statusFilter: string
  categoryFilter: string
  searchFilter: string
  onTierFilterChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
  onSearchFilterChange: (v: string) => void
  onCreateNew: () => void
  onOpenDetail: (id: string) => void
  onPageChange: (offset: number) => void
}

export function IntakePipelineView({
  items,
  loading,
  pagination,
  statusCounts,
  tierFilter,
  statusFilter,
  categoryFilter,
  searchFilter,
  onTierFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSearchFilterChange,
  onCreateNew,
  onOpenDetail,
  onPageChange,
}: IntakePipelineViewProps) {
  return (
    <div className="space-y-4">
      {/* Stats — sourced from server aggregate counts, not current-page items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: statusCounts.total, color: 'bg-neutral-100 text-neutral-800' },
          { label: 'In Bearbeitung', value: statusCounts.inProgress, color: 'bg-warning-100 text-warning-800' },
          { label: 'Bereit', value: statusCounts.ready, color: 'bg-primary-100 text-primary-800' },
          { label: 'Publiziert', value: statusCounts.published, color: 'bg-primary-100 text-primary-800' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-3 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Neues Gerät
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-4 h-4 text-neutral-400" />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => onTierFilterChange(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Stufen</option>
          {getIntakeTierOptions().map(o => (
            <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Status</option>
          {Object.values(INTAKE_STATUS).map(status => (
            <option key={status} value={status}>{INTAKE_STATUS_LABELS[status]}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Kategorien</option>
          {KATEGORIEN.map(k => (
            <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2 text-neutral-500" />
          <input
            type="text"
            placeholder="Suche..."
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
            className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 mb-2">Keine Geräte in der Pipeline</p>
          <button
            onClick={onCreateNew}
            className="text-primary-600 hover:underline text-sm"
          >
            Erstes Gerät erfassen
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="pb-2 font-medium">UUID</th>
                  <th className="pb-2 font-medium">Gerät</th>
                  <th className="pb-2 font-medium">Stufe</th>
                  <th className="pb-2 font-medium">Checkliste</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Spende</th>
                  <th className="pb-2 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => {
                  const progress = item.checklist_progress
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => onOpenDetail(item.id)}
                    >
                      <td className="py-2.5 font-mono text-xs text-neutral-500">{item.item_uuid}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{item.brand} {item.product_name}</div>
                        <div className="text-xs text-neutral-500">
                          {KATEGORIEN.find(k => k.value === item.category)?.label || '-'}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {INTAKE_TIER_ICONS[item.intake_tier]} {INTAKE_TIER_LABELS[item.intake_tier]}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress.percentage === 100 ? 'bg-primary-500' :
                                progress.percentage > 50 ? 'bg-warning-500' : 'bg-error-400'
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500">
                            {progress.requiredCompleted}/{progress.requiredTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {item.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">
                            <Check className="w-3 h-3" /> Publiziert
                          </span>
                        ) : item.checklist_complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">
                            Bereit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning-100 text-warning-800">
                            In Bearbeitung
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.source_donation_id ? (
                          <span className="text-xs text-primary-600">{item.donor_name || 'Ja'}</span>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-neutral-500">
                        {formatDateShort(item.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page: number) => onPageChange((page - 1) * pagination.limit)}
          />
        </>
      )}
    </div>
  )
}
