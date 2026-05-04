"use client"

import { Database, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType, InventoryStats, ShopStats } from './types'

interface ProductTabSwitcherProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  inventoryStats: InventoryStats
  shopStats: ShopStats
}

export function ProductTabSwitcher({
  activeTab,
  onTabChange,
  inventoryStats,
  shopStats,
}: ProductTabSwitcherProps) {
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200">
      <button
        onClick={() => onTabChange('inventory')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'inventory'
            ? "border-primary-600 text-primary-600"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
        )}
      >
        <Database className="w-4 h-4" />
        Erfasste Produkte
        {inventoryStats.total > 0 && (
          <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
            {inventoryStats.total}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('shop')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'shop'
            ? "border-info-600 text-info-600"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
        )}
      >
        <Store className="w-4 h-4" />
        Shop Produkte
        {shopStats.total > 0 && (
          <span className="bg-info-100 text-info-800 text-xs px-2 py-0.5 rounded-full">
            {shopStats.total}
          </span>
        )}
      </button>
    </div>
  )
}
