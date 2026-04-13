import { cn } from '@/lib/utils'
import { URGENCY_LEVELS, OFFER_STATUSES } from '@/config/it-hilfe'

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const level = URGENCY_LEVELS.find(u => u.id === urgency)
  if (!level) return null
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', level.badgeClass)}>
      {level.name}
    </span>
  )
}

export function OfferStatusBadge({ status }: { status: string }) {
  const s = OFFER_STATUSES.find(o => o.id === status)
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', s.badgeClass)}>
      {s.name}
    </span>
  )
}
