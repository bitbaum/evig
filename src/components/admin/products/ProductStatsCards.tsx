"use client"

import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  Users,
} from 'lucide-react'
import type { TabType, InventoryStats, ProductStats } from './types'

interface ProductStatsCardsProps {
  activeTab: TabType
  inventoryStats: InventoryStats
  medusaStats: ProductStats
}

export function ProductStatsCards({
  activeTab,
  inventoryStats,
  medusaStats,
}: ProductStatsCardsProps) {
  if (activeTab === 'inventory') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Gesamt"
          value={inventoryStats.total}
          icon={<Package className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          label="Veröffentlicht"
          value={inventoryStats.published}
          valueColor="text-green-600"
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <StatCard
        label="Gesamt"
        value={medusaStats.total}
        icon={<Package className="w-6 h-6 text-blue-500" />}
      />
      <StatCard
        label="Veröffentlicht"
        value={medusaStats.published}
        valueColor="text-green-600"
        icon={<CheckCircle className="w-6 h-6 text-green-500" />}
      />
      <StatCard
        label="Admin Inventory"
        value={medusaStats.adminInventory}
        valueColor="text-indigo-600"
        icon={<Store className="w-6 h-6 text-indigo-500" />}
      />
      <StatCard
        label="User Listings"
        value={medusaStats.userListings}
        valueColor="text-purple-600"
        icon={<Users className="w-6 h-6 text-purple-500" />}
      />
      <StatCard
        label="Entwürfe"
        value={medusaStats.draft}
        valueColor="text-yellow-600"
        icon={<XCircle className="w-6 h-6 text-yellow-500" />}
      />
      <StatCard
        label="Niedriger Bestand"
        value={medusaStats.lowStock}
        valueColor="text-red-600"
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
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

function StatCard({ label, value, valueColor = 'text-gray-900', icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}
