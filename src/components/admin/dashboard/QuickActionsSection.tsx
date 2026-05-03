import { Link } from '@/i18n/navigation'
import type { QuickAction, FulfillAction } from './types'
import Heading from '@/components/admin/AdminHeading'

interface QuickActionsSectionProps {
  quickActions: QuickAction[]
  fulfillActions: FulfillAction[]
}

export function QuickActionsSection({ quickActions, fulfillActions }: QuickActionsSectionProps) {
  if (quickActions.length === 0 && fulfillActions.length === 0) return null

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-700">
        <Heading level={2} className="font-semibold text-neutral-900 dark:text-white">
          Schnellaktionen
        </Heading>
      </div>

      <div className="p-4 space-y-5">
        {/* Fulfill row — process pending work */}
        {fulfillActions.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Erledigen
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {fulfillActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="relative flex flex-col items-center gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                  >
                    {/* Badge */}
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-bold text-white">
                      {action.count > 99 ? '99+' : action.count}
                    </span>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Create row */}
        {quickActions.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Erstellen
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${action.color}`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
