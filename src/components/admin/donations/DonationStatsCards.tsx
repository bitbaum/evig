import { Heart, Wallet, Package, Clock, TrendingUp } from 'lucide-react'
import { AdminStatsStrip, type StatItem } from '@/components/admin/AdminStatsStrip'
import { formatAmountCHF } from '@/config/donations'
import type { DonationStats } from './types'

interface Props {
  stats: DonationStats
}

/** Donation counts as a compact strip — thin mapper over the shared AdminStatsStrip. */
export function DonationStatsCards({ stats }: Props) {
  const items: StatItem[] = [
    { icon: Heart, color: 'gray', label: 'Total Spenden', value: stats.total },
    { icon: Wallet, color: 'gray', label: 'Geldspenden', value: stats.monetary },
    { icon: Package, color: 'green', label: 'Sachspenden', value: stats.device },
    { icon: Clock, color: 'amber', label: 'Dank ausstehend', value: stats.pendingThanks },
    { icon: TrendingUp, color: 'gray', label: 'Gesamtwert', value: formatAmountCHF(stats.totalValueCents) },
  ]
  return <AdminStatsStrip items={items} />
}
