'use client'

import { CheckCircle2, Circle, CircleAlert, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProtocolReviewChecklistItem } from '@/lib/protocols/review'

interface ProtocolProgressStripProps {
  items: ProtocolReviewChecklistItem[]
  onStepClick?: (id: string) => void
}

const SHORT_LABELS: Record<string, string> = {
  input: 'Input',
  structure: 'Struktur',
  people: 'Personen',
  decisions: 'Entscheide',
  tasks: 'Aufgaben',
  finalize: 'Abschliessen',
}

const STATE_CONFIG = {
  done: {
    icon: CheckCircle2,
    dotClass: 'bg-primary-500 text-white',
    labelClass: 'text-primary-700',
    lineClass: 'bg-primary-400',
  },
  active: {
    icon: Clock,
    dotClass: 'bg-warning-100 dark:bg-warning-900/30 border-2 border-warning-400 text-warning-600',
    labelClass: 'text-warning-700 dark:text-warning-200 font-semibold',
    lineClass: 'bg-neutral-200',
  },
  blocked: {
    icon: CircleAlert,
    dotClass: 'bg-error-100 dark:bg-error-900/30 border-2 border-error-400 text-error-600',
    labelClass: 'text-error-700 dark:text-error-400 font-semibold',
    lineClass: 'bg-neutral-200',
  },
  pending: {
    icon: Circle,
    dotClass: 'bg-surface-raised border border-neutral-300 text-text-muted',
    labelClass: 'text-text-muted',
    lineClass: 'bg-neutral-200',
  },
}

export function ProtocolProgressStrip({ items, onStepClick }: ProtocolProgressStripProps) {
  const activeItem = items.find(i => i.state === 'active' || i.state === 'blocked')

  return (
    <div className="bg-surface-base rounded-lg border border p-4">
      {/* Step dots row */}
      <div className="flex items-center">
        {items.map((item, idx) => {
          const config = STATE_CONFIG[item.state]
          const Icon = config.icon
          const isLast = idx === items.length - 1

          return (
            <div key={item.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onStepClick?.(item.id)}
                disabled={!onStepClick}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-0',
                  onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                )}
              >
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', config.dotClass)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={cn('text-xs truncate max-w-[56px]', config.labelClass)}>
                  {SHORT_LABELS[item.id] ?? item.label}
                </span>
              </button>
              {!isLast && (
                <div className={cn('flex-1 h-0.5 mx-1 mt-[-12px]', config.lineClass)} />
              )}
            </div>
          )
        })}
      </div>

      {/* Active step hint */}
      {activeItem && (
        <div className={cn(
          'mt-3 pt-3 border-t border-subtle dark:border-white/6 text-xs',
          activeItem.state === 'blocked' ? 'text-error-600' : 'text-warning-700 dark:text-warning-400'
        )}>
          <span className="font-medium">{activeItem.label}: </span>
          {activeItem.description}
        </div>
      )}
    </div>
  )
}
