import { Link } from '@/i18n/navigation'
import { Check, ArrowRight } from 'lucide-react'
import { InlineActionButton } from './InlineActionButton'
import { formatQueueAge } from './format'
import type { UnifiedQueueItem } from './types'

interface UnifiedQueueProps {
  items: UnifiedQueueItem[]
}

const URGENCY_DOT = {
  urgent: 'bg-error-500',
  warning: 'bg-warning-500',
  success: 'bg-action',
} as const

const URGENCY_BADGE = {
  urgent: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  success: 'bg-action-muted text-action',
} as const

const URGENCY_AGE_TEXT = {
  urgent: 'text-error-600 dark:text-error-400',
  warning: 'text-warning-700 dark:text-warning-400',
  success: 'text-action',
} as const

const URGENCY_LABEL = {
  urgent: 'Dringend',
  warning: 'Ausstehend',
  success: 'Info',
} as const

/**
 * "Auf deinem Tisch" — the day's queue.
 *
 * No outer card chrome. Pure list rendered directly on the page
 * background, separated from neighbouring sections by the parent's
 * `space-y-12`. Each row gets its own subtle inner container only to
 * carry the hover affordance — the wider page composition stays flat
 * so multiple sections don't stack as competing cards.
 *
 * Empty state still gets a small reassurance line.
 */
export function UnifiedQueue({ items }: UnifiedQueueProps) {
  return (
    <section aria-labelledby="dashboard-queue-title">
      <div className="flex items-baseline justify-between">
        <h2
          id="dashboard-queue-title"
          className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
        >
          Auf deinem Tisch
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-xs tabular-nums text-text-tertiary">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary">
          <Check className="h-4 w-4 text-action" aria-hidden="true" />
          Alles erledigt — keine offenen Aufgaben.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-subtle rounded-lg border border-subtle bg-surface-base">
          {items.map((item, index) => {
            const age = formatQueueAge(item.oldestAt)
            const ariaLabel = `${URGENCY_LABEL[item.type]}: ${item.label}${age ? `, ${age}` : ''}${item.count ? `, ${item.count} Einträge` : ''}`
            return (
              <li key={index}>
                <Link
                  href={item.href}
                  aria-label={ariaLabel}
                  className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-[6px] h-2 w-2 shrink-0 rounded-full ${URGENCY_DOT[item.type]}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-text-primary">
                        {item.label}
                      </p>
                      {age && (
                        <p className={`mt-0.5 text-xs ${URGENCY_AGE_TEXT[item.type]}`}>
                          {age}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.inlineAction && (
                      <InlineActionButton
                        itemId={item.inlineAction.itemId}
                        actionType={item.inlineAction.actionType}
                      />
                    )}
                    {item.count !== undefined && (
                      <span
                        className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${URGENCY_BADGE[item.type]}`}
                        aria-hidden="true"
                      >
                        {item.count > 99 ? '99+' : item.count}
                      </span>
                    )}
                    <span className="hidden items-center gap-1 text-xs text-text-tertiary transition-colors group-hover:text-action sm:flex">
                      {item.actionLabel}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
