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
import { INTAKE_STATUS } from '@/config/intake-status'
import { LISTING_STATUS } from '@/config/marketplace'
import { Pagination } from '@/components/ui/Pagination'
import type { PipelineItem } from './types'

interface IntakePipelineViewProps {
  items: PipelineItem[]
  loading: boolean
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: pagination.total, color: 'bg-gray-100 text-gray-800' },
          { label: 'In Bearbeitung', value: items.filter(i => !i.checklist_complete && i.marketplace_status === LISTING_STATUS.DRAFT).length, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Bereit', value: items.filter(i => i.checklist_complete && i.marketplace_status === LISTING_STATUS.DRAFT).length, color: 'bg-green-100 text-green-800' },
          { label: 'Publiziert', value: items.filter(i => i.marketplace_status === INTAKE_STATUS.PUBLISHED).length, color: 'bg-blue-100 text-blue-800' },
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
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Neues Gerät
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-4 h-4 text-gray-400" />
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
          <option value="in_progress">In Bearbeitung</option>
          <option value="ready">Bereit</option>
          <option value="published">Publiziert</option>
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
          <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
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
        <div className="text-center py-8 text-gray-500">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Keine Geräte in der Pipeline</p>
          <button
            onClick={onCreateNew}
            className="text-blue-600 hover:underline text-sm"
          >
            Erstes Gerät erfassen
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
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
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onOpenDetail(item.id)}
                    >
                      <td className="py-2.5 font-mono text-xs text-gray-500">{item.item_uuid}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{item.brand} {item.product_name}</div>
                        <div className="text-xs text-gray-500">
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
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress.percentage === 100 ? 'bg-green-500' :
                                progress.percentage > 50 ? 'bg-yellow-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress.requiredCompleted}/{progress.requiredTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {item.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                            <Check className="w-3 h-3" /> Publiziert
                          </span>
                        ) : item.checklist_complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            Bereit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            In Bearbeitung
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.source_donation_id ? (
                          <span className="text-xs text-green-600">{item.donor_name || 'Ja'}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('de-CH')}
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
