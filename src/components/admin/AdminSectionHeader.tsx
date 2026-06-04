import { cn } from '@/lib/utils'
import { adminType } from '@/lib/admin-ui'
import type { LucideIcon } from 'lucide-react'

interface AdminSectionHeaderProps {
  title: string
  description?: string
  /** Optional icon rendered before the title */
  icon?: LucideIcon
  /** Optional right-side actions slot */
  actions?: React.ReactNode
  /** Render a bottom border (useful as a card section divider) */
  divider?: boolean
  className?: string
}

/**
 * Standard section / card header.
 *
 * Replaces the scattered pattern of:
 *   <Heading level={2} className="font-semibold ...">
 *   <div className="p-4 border-b"><Heading ...>
 *   <h3 className="text-sm font-medium text-text-secondary">
 *
 * Usage:
 *   <AdminSectionHeader title="Teilnehmer" divider />
 *   <AdminSectionHeader title="Ergebnisse" actions={<button>...</button>} />
 */
export function AdminSectionHeader({
  title,
  description,
  icon: Icon,
  actions,
  divider = false,
  className,
}: AdminSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3',
        divider && 'pb-3 border-b border',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-text-muted shrink-0" />}
        <div className="min-w-0">
          <h2 className={adminType.sectionTitle}>{title}</h2>
          {description && (
            <p className={cn(adminType.meta, 'mt-0.5')}>{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
