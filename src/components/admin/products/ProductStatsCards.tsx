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
          icon={<Package className="w-6 h-6 text-primary-500" />}
        />
        <StatCard
          label="Veröffentlicht"
          value={inventoryStats.published}
          valueColor="text-primary-600"
          icon={<CheckCircle className="w-6 h-6 text-primary-500" />}
        />
        <StatCard
          label="Entwürfe"
          value={inventoryStats.draft}
          valueColor="text-yellow-600"
          icon={<XCircle className="w-6 h-6 text-yellow-500" />}
        />
        <StatCard
          label="Freigegeben"
          value={inventoryStats.approved}
          valueColor="text-blue-600"
          icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          label="Zur Prüfung"
          value={inventoryStats.pending}
          valueColor="text-orange-600"
          icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
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
        icon={<Package className="w-6 h-6 text-indigo-500" />}
      />
      {conditionEntries.map(([condition, count]) => (
        <StatCard
          key={condition}
          label={getConditionLabel(condition)}
          value={count}
          valueColor="text-blue-600"
          icon={<Tag className="w-6 h-6 text-blue-500" />}
        />
      ))}
      <StatCard
        label="Niedriger Bestand"
        value={shopStats.lowStock}
        valueColor={shopStats.lowStock > 0 ? "text-error-600" : "text-neutral-600"}
        icon={<AlertTriangle className={`w-6 h-6 ${shopStats.lowStock > 0 ? 'text-error-500' : 'text-neutral-400'}`} />}
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

function StatCard({ label, value, valueColor = 'text-neutral-900', icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-600">{label}</p>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}
