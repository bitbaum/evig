'use client'

import { Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { InventoryStatsData } from '../types'

interface InventoryStatsProps {
  stats: InventoryStatsData
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Gesamt</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <Package className="w-6 h-6 text-green-500" />
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
            <p className="text-xs text-gray-600">Entwürfe</p>
            <p className="text-xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          <XCircle className="w-6 h-6 text-yellow-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Freigegeben</p>
            <p className="text-xl font-bold text-blue-600">{stats.approved}</p>
          </div>
          <CheckCircle className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Zur Prüfung</p>
            <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
      </div>
    </div>
  )
}
