"use client"

import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
} from 'lucide-react'
import { getConditionLabel } from '@/config/erfassung'
import type { TabType, InventoryStats, ShopStats } from './types'

interface ProductStatsCardsProps {
  activeTab: TabType
  inventoryStats: InventoryStats
  shopStats: ShopStats
}

export function ProductStatsCards({
  activeTab,
  inventoryStats,
  shopStats,
}: ProductStatsCardsProps) {
  if (activeTab === 'inventory') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Gesamt"
          value={inventoryStats.total}
          icon={<Package className="w-6 h-6 text-action" />}
        />
        <StatCard
          label="Veröffentlicht"
          value={inventoryStats.published}
          valueColor="text-action"
          icon={<CheckCircle className="w-6 h-6 text-action" />}
        />
        <StatCard
          label="Entwürfe"
          value={inventoryStats.draft}
          valueColor="text-warning-600"
          icon={<XCircle className="w-6 h-6 text-warning-500" />}
        />
        <StatCard
          label="Freigegeben"
          value={inventoryStats.approved}
          valueColor="text-action"
          icon={<CheckCircle className="w-6 h-6 text-action" />}
        />
        <StatCard
          label="Zur Prüfung"
          value={inventoryStats.pending}
          valueColor="text-secondary-600"
          icon={<AlertTriangle className="w-6 h-6 text-secondary-500" />}
        />
      </div>
    )
  }

  // Shop tab - show condition breakdown
  const conditionEntries = Object.entries(shopStats.byCondition)
    .filter(([, count]) => count > 0)
    .slice(0, 3) // Top 3 conditions

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Im Shop"
        value={shopStats.total}
        icon={<Package className="w-6 h-6 text-action" />}
      />
      {conditionEntries.map(([condition, count]) => (
        <StatCard
          key={condition}
          label={getConditionLabel(condition)}
          value={count}
          valueColor="text-action"
          icon={<Tag className="w-6 h-6 text-action" />}
        />
      ))}
      <StatCard
        label="Niedriger Bestand"
        value={shopStats.lowStock}
        valueColor={shopStats.lowStock > 0 ? "text-error-600" : "text-text-secondary"}
        icon={<AlertTriangle className={`w-6 h-6 ${shopStats.lowStock > 0 ? 'text-error-500' : 'text-text-muted'}`} />}
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  valueColor?: string
  icon: React.ReactNode
}

function StatCard({ label, value, valueColor = 'text-text-primary', icon }: StatCardProps) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}
