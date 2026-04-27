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
    dot: 'bg-red-500',
    label: 'Dringend',
    text: 'text-red-700 dark:text-red-400',
  },
  warning: {
    dot: 'bg-amber-500',
    label: 'Ausstehend',
    text: 'text-amber-700 dark:text-amber-400',
  },
  success: {
    dot: 'bg-green-500',
    label: 'Information',
    text: 'text-green-700 dark:text-green-400',
  },
}

export function ActionItemsSection({ actionItems }: ActionItemsSectionProps) {
  const hasNoActionItems = actionItems.length === 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Was gibt es zu tun?
        </Heading>
      </div>

      <div className="p-4">
        {hasNoActionItems ? (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
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
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    aria-label={`${urgency.label}: ${item.label}${age ? ` (${age})` : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 w-3 h-3 flex-shrink-0 rounded-full ${urgency.dot}`}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </span>
                        {age && (
                          <p className={`text-xs mt-0.5 ${urgency.text}`}>
                            {age}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex-shrink-0 ml-3">
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
