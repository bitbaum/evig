"use client"

import { Link } from '@/i18n/navigation'
import { Search, Plus } from 'lucide-react'
import type { TabType, FilterStatus } from './types'

interface ProductFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterStatus: FilterStatus
  onFilterStatusChange: (status: FilterStatus) => void
  filterCategory: string
  onFilterCategoryChange: (category: string) => void
  selectedCount: number
  onBulkDelete: () => void
  activeTab: TabType
}

export function ProductFilterBar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  selectedCount,
  onBulkDelete,
  activeTab,
}: ProductFilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Produkte suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters - only show status filter for inventory tab */}
          <div className="flex gap-2">
            {activeTab === 'inventory' && (
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alle Status</option>
                <option value="published">Veröffentlicht</option>
                <option value="draft">Entwurf</option>
              </select>
            )}

            <select
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle Kategorien</option>
              <option value="Laptops">Laptops</option>
              <option value="Desktops">Desktops</option>
              <option value="Monitore">Monitore</option>
              <option value="Zubehör">Zubehör</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <button
              onClick={onBulkDelete}
              className="px-4 py-2 text-error-600 border border-error-200 rounded-lg hover:bg-error-50 transition-colors"
            >
              {selectedCount} löschen
            </button>
          )}
          {activeTab === 'inventory' && (
            <Link
              href="/admin/erfassung"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Produkt erfassen
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
