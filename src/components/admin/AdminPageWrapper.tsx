import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { adminIconBox, adminIconColor, adminType, type AdminIconColorKey } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

interface AdminPageWrapperProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: AdminIconColorKey
  backButton?: { href: string; label: string }
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Standard admin page shell.
 * Provides: back link, icon, title, description, and right-side actions slot.
 * Used by all admin pages — changing this cascades to the whole admin UI.
 */
export default function AdminPageWrapper({
  title,
  description,
  icon: Icon,
  iconColor = 'blue',
  backButton,
  actions,
  children,
}: AdminPageWrapperProps) {
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon box */}
          {Icon && (
            <div className={cn(adminIconBox.md, adminIconColor[iconColor], 'mt-0.5')}>
              <Icon className={adminIconBox.iconMd} />
            </div>
          )}

          <div className="min-w-0">
            {/* Back link — above the title, low visual weight */}
            {backButton && (
              <Link
                href={backButton.href}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors mb-1"
              >
                <ArrowLeft className="w-3 h-3" />
                {backButton.label}
              </Link>
            )}

            {/* Page title — primary visual anchor */}
            <h1 className={adminType.pageTitle}>{title}</h1>

            {description && (
              <p className={cn(adminType.meta, 'mt-0.5')}>{description}</p>
            )}
          </div>
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 sm:mt-0.5">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
