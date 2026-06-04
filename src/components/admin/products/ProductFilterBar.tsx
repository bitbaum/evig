"use client"

import { Link } from '@/i18n/navigation'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'
import { ROUTES } from '@/config/routes'
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
    <div className="bg-surface-base rounded-xl shadow-sm border border p-4 md:p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Produkte suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters - only show status filter for inventory tab */}
          <div className="flex gap-2">
            {activeTab === 'inventory' && (
              <Select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
              >
                <option value="all">Alle Status</option>
                <option value="published">Veröffentlicht</option>
                <option value="draft">Entwurf</option>
              </Select>
            )}

            <Select
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange(e.target.value)}
            >
              <option value="all">Alle Kategorien</option>
              <option value="Laptops">Laptops</option>
              <option value="Desktops">Desktops</option>
              <option value="Monitore">Monitore</option>
              <option value="Zubehör">Zubehör</option>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <Button onClick={onBulkDelete} variant="destructive" size="sm">
              {selectedCount} löschen
            </Button>
          )}
          {activeTab === 'inventory' && (
            <Link href={ROUTES.admin.erfassung} className={buttonClass({ variant: 'primary', size: 'sm' })}>
              <Plus className="w-4 h-4" />
              Produkt erfassen
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
