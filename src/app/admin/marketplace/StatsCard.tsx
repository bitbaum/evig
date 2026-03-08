'use client'

import type { Package } from 'lucide-react'

export function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: string }) {
  return (
    <div className={`p-4 ${color} rounded-lg border`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 opacity-70" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  )
}
