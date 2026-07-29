'use client'

import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import type { IntakeEventType } from '@/lib/intake/timeline-types'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/intake/timeline-types'
import type { DetailData } from '../types'

interface IntakeTimelineProps {
  detail: DetailData
}

export function IntakeTimeline({ detail }: IntakeTimelineProps) {
  const t = useTranslations('admin.intake.detail')

  if (!(detail.intake_events && detail.intake_events.length > 0)) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-surface-raised border-b">
        <Clock className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-medium">{t('timelineHeading')}</span>
        <span className="text-xs text-text-tertiary">({detail.intake_events.length})</span>
      </div>
      <div className="divide-y max-h-64 overflow-y-auto">
        {[...detail.intake_events].reverse().map((event, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2 text-xs">
            <span className="mt-0.5 text-base leading-none">{EVENT_TYPE_ICONS[event.type as IntakeEventType] || '📋'}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{EVENT_TYPE_LABELS[event.type as IntakeEventType] || event.type}</span>
              <span className="text-text-tertiary ml-1.5">{event.description}</span>
              <div className="text-text-muted mt-0.5">
                {event.userEmail && <span>{event.userEmail}</span>}
                {event.timestamp && (
                  <span className="ml-2">{new Date(event.timestamp).toLocaleString('de-CH')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
