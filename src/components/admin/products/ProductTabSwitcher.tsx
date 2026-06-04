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
    <div className="flex items-center gap-2 border-b border">
      <button
        onClick={() => onTabChange('inventory')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'inventory'
            ? "border-action text-action"
            : "border-transparent text-text-tertiary hover:text-text-secondary"
        )}
      >
        <Database className="w-4 h-4" />
        Erfasste Produkte
        {inventoryStats.total > 0 && (
          <span className="bg-action-muted-muted text-action text-xs px-2 py-0.5 rounded-full">
            {inventoryStats.total}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('shop')}
        className={cn(
          "px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors",
          activeTab === 'shop'
            ? "border-action text-action"
            : "border-transparent text-text-tertiary hover:text-text-secondary"
        )}
      >
        <Store className="w-4 h-4" />
        Shop Produkte
        {shopStats.total > 0 && (
          <span className="bg-action-muted-muted text-action text-xs px-2 py-0.5 rounded-full">
            {shopStats.total}
          </span>
        )}
      </button>
    </div>
  )
}
