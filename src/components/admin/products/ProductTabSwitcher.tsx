"use client"

import { Database, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType, InventoryStats, ProductStats } from './types'

interface ProductTabSwitcherProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  inventoryStats: InventoryStats
  medusaStats: ProductStats
}

export function ProductTabSwitcher({
  activeTab,
  onTabChange,
  inventoryStats,
  medusaStats,
}: ProductTabSwitcherProps) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200">
      <button
        onClick={() => onTabChange('inventory')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'inventory'
            ? "border-green-600 text-green-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        )}
      >
        <Database className="w-4 h-4" />
        Erfasste Produkte
        {inventoryStats.total > 0 && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
            {inventoryStats.total}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('medusa')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'medusa'
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        )}
      >
        <Store className="w-4 h-4" />
        Shop Produkte (Medusa)
        {medusaStats.total > 0 && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
            {medusaStats.total}
          </span>
        )}
      </button>
    </div>
  )
}
