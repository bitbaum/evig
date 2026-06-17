import { formatAmountCHF } from '@/config/donations'
import type { DonationStats } from './types'

interface Props {
  stats: DonationStats
}

export function DonationStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-surface-base rounded-lg border border-subtle p-4 border-l-4 border-action">
        <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
        <div className="text-sm text-text-secondary">Total Spenden</div>
      </div>
      <div className="bg-surface-base rounded-lg border border-subtle p-4 border-l-4 border-strong">
        <div className="text-2xl font-bold text-text-primary">{stats.monetary}</div>
        <div className="text-sm text-text-secondary">Geldspenden</div>
      </div>
      <div className="bg-surface-base rounded-lg border border-subtle p-4 border-l-4 border-action">
        <div className="text-2xl font-bold text-text-primary">{stats.device}</div>
        <div className="text-sm text-text-secondary">Sachspenden</div>
      </div>
      <div className="bg-surface-base rounded-lg border border-subtle p-4 border-l-4 border-warning-500">
        <div className="text-2xl font-bold text-text-primary">{stats.pendingThanks}</div>
        <div className="text-sm text-text-secondary">Dank ausstehend</div>
      </div>
      <div className="bg-surface-base rounded-lg border border-subtle p-4 border-l-4 border-strong">
        <div className="text-2xl font-bold text-text-primary">{formatAmountCHF(stats.totalValueCents)}</div>
        <div className="text-sm text-text-secondary">Gesamtwert</div>
      </div>
    </div>
  )
}
