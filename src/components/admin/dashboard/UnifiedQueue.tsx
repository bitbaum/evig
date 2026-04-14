import Link from 'next/link'
import { Check } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import type { UnifiedQueueItem } from './types'

interface UnifiedQueueProps {
  items: UnifiedQueueItem[]
}

function formatAge(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'heute eingegangen'
  if (days === 1) return 'seit gestern'
  return `ältestes: vor ${days} Tagen`
}

const URGENCY_CONFIG = {
  urgent: {
    dot: 'bg-red-500',
    label: 'Dringend',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    dot: 'bg-amber-500',
    label: 'Ausstehend',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  success: {
    dot: 'bg-green-500',
    label: 'Info',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
} as const

export function UnifiedQueue({ items }: UnifiedQueueProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-medium">Alles erledigt — keine offenen Aufgaben.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="px-4 pt-4 pb-1">
        <Heading level={2} className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Wartet auf Bearbeitung
        </Heading>
      </div>

      <ul className="p-2 space-y-0.5" role="list">
        {items.map((item, index) => {
          const urgency = URGENCY_CONFIG[item.type]
          const age = formatAge(item.oldestAt)
          const ariaLabel = `${urgency.label}: ${item.label}${age ? `, ${age}` : ''}${item.count ? `, ${item.count} Einträge` : ''}`

          return (
            <li key={index}>
              <Link
                href={item.href}
                aria-label={ariaLabel}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                {/* Left: urgency dot + label + age */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Urgency dot — decorative, aria-hidden */}
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full ${urgency.dot}`}
                    aria-hidden="true"
                  />
                  {/* Urgency text — visible to screen readers via aria-label, shown small for sighted users */}
                  <div className="min-w-0">
                    {/* Urgency label — sighted users see it via dot color + text */}
                    <span className={`text-xs font-medium ${urgency.text}`} aria-hidden="true">
                      {urgency.label}
                    </span>
                    <p className="font-medium text-sm text-gray-900 dark:text-white leading-snug">
                      {item.label}
                    </p>
                    {age && (
                      <p className={`text-xs ${urgency.text}`}>
                        {age}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: count badge + action label */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.count !== undefined && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${urgency.badge}`}>
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                  <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {item.actionLabel} →
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
