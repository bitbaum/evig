import Link from 'next/link'
import { Zap, Check, ArrowRight } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { InlineActionButton } from './InlineActionButton'
import { formatQueueAge } from './format'
import type { UnifiedQueueItem } from './types'

interface UnifiedQueueProps {
  items: UnifiedQueueItem[]
}

const URGENCY_CONFIG = {
  urgent: {
    dot: 'bg-red-500',
    label: 'Dringend',
    ageText: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  warning: {
    dot: 'bg-amber-500',
    label: 'Ausstehend',
    ageText: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  success: {
    dot: 'bg-green-500',
    label: 'Info',
    ageText: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
} as const

export function UnifiedQueue({ items }: UnifiedQueueProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Card header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Wartet auf Bearbeitung
        </Heading>
      </div>

      {/* Body */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-medium">Alles erledigt — keine offenen Aufgaben.</span>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {items.map((item, index) => {
              const urgency = URGENCY_CONFIG[item.type]
              const age = formatQueueAge(item.oldestAt)
              const ariaLabel = `${urgency.label}: ${item.label}${age ? `, ${age}` : ''}${item.count ? `, ${item.count} Einträge` : ''}`

              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    aria-label={ariaLabel}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    {/* Left: dot + text */}
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`mt-[5px] flex-shrink-0 w-2.5 h-2.5 rounded-full ${urgency.dot}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white leading-snug">
                          {item.label}
                        </p>
                        {age && (
                          <p className={`text-sm mt-0.5 ${urgency.ageText}`}>
                            {age}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: inline action button (if set) + count badge + arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.inlineAction && (
                        <InlineActionButton
                          itemId={item.inlineAction.itemId}
                          actionType={item.inlineAction.actionType}
                        />
                      )}
                      {item.count !== undefined && (
                        <span
                          className={`inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-sm font-bold ${urgency.badge}`}
                          aria-hidden="true"
                        >
                          {item.count > 99 ? '99+' : item.count}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {item.actionLabel}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
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
