"use client"

import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import type { InventoryStats } from './types'

interface ProductStatsCardsProps {
  inventoryStats: InventoryStats
}

export function ProductStatsCards({ inventoryStats }: ProductStatsCardsProps) {
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
