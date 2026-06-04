import { Link } from '@/i18n/navigation'
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
    dot: 'bg-error-500',
    label: 'Dringend',
    ageText: 'text-error-600 dark:text-error-400',
    badge: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  },
  warning: {
    dot: 'bg-warning-500',
    label: 'Ausstehend',
    ageText: 'text-warning-700 dark:text-warning-400',
    badge: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  },
  success: {
    dot: 'bg-primary-500',
    label: 'Info',
    ageText: 'text-primary-700 dark:text-primary-400',
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
} as const

export function UnifiedQueue({ items }: UnifiedQueueProps) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6">
      {/* Card header */}
      <div className="p-4 border-b border-subtle dark:border-white/6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-warning-500 shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-text-primary">
          Wartet auf Bearbeitung
        </Heading>
      </div>

      {/* Body */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 text-action">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
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
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-raised dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-white/6 transition-colors group"
                  >
                    {/* Left: dot + text */}
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`mt-[5px] shrink-0 w-2.5 h-2.5 rounded-full ${urgency.dot}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary leading-snug">
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
                    <div className="flex items-center gap-2 shrink-0">
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
                      <span className="flex items-center gap-1 text-sm text-text-tertiary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
