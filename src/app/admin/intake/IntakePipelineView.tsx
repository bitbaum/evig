'use client'

import {
  Plus, Search, Filter, Check, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
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
          { label: 'Total', value: statusCounts.total, color: 'bg-surface-raised text-neutral-800' },
          { label: 'In Bearbeitung', value: statusCounts.inProgress, color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200' },
          { label: 'Bereit', value: statusCounts.ready, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300' },
          { label: 'Publiziert', value: statusCounts.published, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-3 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={onCreateNew} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> Neues Gerät
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-4 h-4 text-text-muted" />
        </div>

        <Select
          value={tierFilter}
          onChange={(e) => onTierFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">Alle Stufen</option>
          {getIntakeTierOptions().map(o => (
            <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">Alle Status</option>
          {Object.values(INTAKE_STATUS).map(status => (
            <option key={status} value={status}>{INTAKE_STATUS_LABELS[status]}</option>
          ))}
        </Select>

        <Select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">Alle Kategorien</option>
          {KATEGORIEN.map(k => (
            <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
          ))}
        </Select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            type="text"
            placeholder="Suche..."
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
            className="pl-8 pr-3 w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-text-tertiary">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised rounded-lg">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-text-tertiary mb-2">Keine Geräte in der Pipeline</p>
          <button
            onClick={onCreateNew}
            className="text-action hover:underline text-sm"
          >
            Erstes Gerät erfassen
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-tertiary">
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
                      <td className="py-2.5 font-mono text-xs text-text-tertiary">{item.item_uuid}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{item.brand} {item.product_name}</div>
                        <div className="text-xs text-text-tertiary">
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
                          <span className="text-xs text-text-tertiary">
                            {progress.requiredCompleted}/{progress.requiredTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {item.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                            <Check className="w-3 h-3" /> Publiziert
                          </span>
                        ) : item.checklist_complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                            Bereit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200">
                            In Bearbeitung
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.source_donation_id ? (
                          <span className="text-xs text-action">{item.donor_name || 'Ja'}</span>
                        ) : (
                          <span className="text-xs text-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-text-tertiary">
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
