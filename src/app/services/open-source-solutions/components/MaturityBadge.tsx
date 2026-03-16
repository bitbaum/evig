import { cn } from '@/lib/utils'
import { type Maturity, MATURITY_CONFIG } from '@/config/open-source-registry'

interface MaturityBadgeProps {
  maturity: Maturity
  className?: string
}

export function MaturityBadge({ maturity, className }: MaturityBadgeProps) {
  const config = MATURITY_CONFIG[maturity]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color, className)}>
      {config.label}
    </span>
  )
}
