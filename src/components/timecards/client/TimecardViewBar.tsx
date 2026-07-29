'use client'

import { useTranslations } from 'next-intl'
import { ChevronRight, ChevronLeft, CalendarDays, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import type { UseTimecardDraftResult } from '../useTimecardDraft'

/** Owns the view-toggle bar: month/day tabs, day-view prev/next navigation, and the month-view selection hints. */
export function TimecardViewBar({
  tc,
  view,
  setView,
  dayIndex,
  gotoDay,
}: {
  tc: UseTimecardDraftResult
  view: 'month' | 'day'
  setView: (view: 'month' | 'day') => void
  dayIndex: number
  gotoDay: (delta: number) => void
}) {
  const t = useTranslations('admin.timecards')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {view === 'month' ? (
        <>
          {/* Gesture hints match the input device: the drag/Ctrl/Shift text
              describes gestures that don't exist on touch screens. */}
          <p className="text-sm text-text-tertiary [@media(pointer:coarse)]:hidden">{t('selectHint')}</p>
          <p className="hidden text-sm text-text-tertiary [@media(pointer:coarse)]:block">{t('selectHintTouch')}</p>
        </>
      ) : (
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => gotoDay(-1)} disabled={dayIndex <= 0} aria-label={t('dayPrev')}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="min-w-[11rem] text-center text-sm font-medium text-text-primary">
            {getDisplayDate(tc.draft.selectedDate)}
          </span>
          <Button type="button" variant="ghost" size="icon" onClick={() => gotoDay(1)} disabled={dayIndex < 0 || dayIndex >= tc.visibleDates.length - 1} aria-label={t('dayNext')}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      <div className="inline-flex rounded-lg border border-subtle p-0.5">
        <ViewTab active={view === 'month'} onClick={() => setView('month')} icon={<CalendarRange className="h-3.5 w-3.5" />}>
          {t('viewMonth')}
        </ViewTab>
        <ViewTab active={view === 'day'} onClick={() => setView('day')} icon={<CalendarDays className="h-3.5 w-3.5" />}>
          {t('viewDay')}
        </ViewTab>
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'gap-1.5 rounded-md px-3 text-sm',
        active ? 'bg-surface-raised text-text-primary' : 'text-text-tertiary hover:text-text-secondary',
      )}
    >
      {icon}
      {children}
    </Button>
  )
}
