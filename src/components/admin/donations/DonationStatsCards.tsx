import { formatAmountCHF } from '@/config/donations'
import type { DonationStats } from './types'

interface Props {
  stats: DonationStats
}

export function DonationStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
        <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
        <div className="text-sm text-neutral-600">Total Spenden</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-neutral-400">
        <div className="text-2xl font-bold text-neutral-900">{stats.monetary}</div>
        <div className="text-sm text-neutral-600">Geldspenden</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
        <div className="text-2xl font-bold text-neutral-900">{stats.device}</div>
        <div className="text-sm text-neutral-600">Sachspenden</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-warning-500">
        <div className="text-2xl font-bold text-neutral-900">{stats.pendingThanks}</div>
        <div className="text-sm text-neutral-600">Dank ausstehend</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
        <div className="text-2xl font-bold text-neutral-900">{formatAmountCHF(stats.totalValueCents)}</div>
        <div className="text-sm text-neutral-600">Gesamtwert</div>
      </div>
    </div>
  )
}
