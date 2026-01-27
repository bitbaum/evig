'use client'

import { Package, CheckCircle, XCircle, AlertTriangle, Store, Users } from 'lucide-react'
import type { ProductStats } from '../types'

interface MedusaStatsProps {
  stats: ProductStats
}

export function MedusaStats({ stats }: MedusaStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Gesamt</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <Package className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Veröffentlicht</p>
            <p className="text-xl font-bold text-green-600">{stats.published}</p>
          </div>
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Admin Inventory</p>
            <p className="text-xl font-bold text-indigo-600">{stats.adminInventory}</p>
          </div>
          <Store className="w-6 h-6 text-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">User Listings</p>
            <p className="text-xl font-bold text-purple-600">{stats.userListings}</p>
          </div>
          <Users className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Entwürfe</p>
            <p className="text-xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          <XCircle className="w-6 h-6 text-yellow-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Niedriger Bestand</p>
            <p className="text-xl font-bold text-red-600">{stats.lowStock}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
      </div>
    </div>
  )
}
