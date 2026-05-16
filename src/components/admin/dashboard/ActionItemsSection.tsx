import { Link } from '@/i18n/navigation'
import { Zap, ArrowRight, Check } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { formatQueueAge } from './format'
import type { ActionItem } from './types'

interface ActionItemsSectionProps {
  actionItems: ActionItem[]
}

const URGENCY_CONFIG = {
  urgent: {
    dot: 'bg-error-500',
    label: 'Dringend',
    text: 'text-error-700 dark:text-error-400',
  },
  warning: {
    dot: 'bg-warning-500',
    label: 'Ausstehend',
    text: 'text-warning-700 dark:text-warning-400',
  },
  success: {
    dot: 'bg-primary-500',
    label: 'Information',
    text: 'text-primary-700 dark:text-primary-400',
  },
}

export function ActionItemsSection({ actionItems }: ActionItemsSectionProps) {
  const hasNoActionItems = actionItems.length === 0

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-white/[0.06]">
      <div className="p-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center gap-2">
        <Zap className="w-5 h-5 text-warning-500" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-neutral-900 dark:text-white">
          Was gibt es zu tun?
        </Heading>
      </div>

      <div className="p-4">
        {hasNoActionItems ? (
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Check className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-medium">Alles erledigt! Keine offenen Aufgaben.</span>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {actionItems.map((item, index) => {
              const urgency = URGENCY_CONFIG[item.type]
              const age = formatQueueAge(item.oldestAt)
              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors group"
                    aria-label={`${urgency.label}: ${item.label}${age ? ` (${age})` : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 w-3 h-3 flex-shrink-0 rounded-full ${urgency.dot}`}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {item.label}
                        </span>
                        {age && (
                          <p className={`text-xs mt-0.5 ${urgency.text}`}>
                            {age}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 ml-3">
                      {item.actionLabel}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
