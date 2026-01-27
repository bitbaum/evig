'use client'

import Link from 'next/link'
import { Search, Plus, Upload } from 'lucide-react'
import type { FilterStatus, FilterSource, ActiveTab } from '../types'

interface ProductFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterSource: FilterSource
  onFilterSourceChange: (value: FilterSource) => void
  filterStatus: FilterStatus
  onFilterStatusChange: (value: FilterStatus) => void
  filterCategory: string
  onFilterCategoryChange: (value: string) => void
  selectedCount: number
  onBulkDelete?: () => void
  onBulkImport: () => void
  activeTab: ActiveTab
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  filterSource,
  onFilterSourceChange,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  selectedCount,
  onBulkDelete,
  onBulkImport,
  activeTab,
}: ProductFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Produkte suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterSource}
              onChange={(e) => onFilterSourceChange(e.target.value as FilterSource)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle Quellen</option>
              <option value="admin">Admin Inventory</option>
              <option value="user">User Marketplace</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle Status</option>
              <option value="published">Veröffentlicht</option>
              <option value="draft">Entwurf</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              {selectedCount} löschen
            </button>
          )}
          {activeTab === 'inventory' ? (
            <Link
              href="/admin/erfassung"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Produkt erfassen
            </Link>
          ) : (
            <>
              <button
                onClick={onBulkImport}
                className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Bulk Import
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Neues Produkt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
