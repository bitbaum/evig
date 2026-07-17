'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronRight, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import {
  parseWeeklySchedule,
  serializeWeeklySchedule,
  STANDARD_WEEKLY_SCHEDULE,
  WEEKDAY_IDS,
  type WeeklySchedule,
  type WeekdayId,
} from '@/lib/team/schedule'

/**
 * Inline "Mein Arbeitsplan" editor — lets a team member set their own weekly
 * schedule right where they use it (the timecard tool), instead of clicking
 * through the admin team editor. Saves to team_profiles.working_hours via
 * PUT /api/team/schedule and refreshes so the calendar's "fill" uses it.
 *
 * Collapsed by default (shows a one-line summary); the 95% case is "looks
 * right, leave it". Quick "Standard Mo–Fr 09–17" sets the sensible default
 * in one tap.
 */
export function WeeklyScheduleEditor({ workingHours }: { workingHours: string | null }) {
  const t = useTranslations('admin.timecards')
  const { weekdayLabel, scheduleSummary } = useTimecardIntl()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => parseWeeklySchedule(workingHours))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patchDay = useCallback((day: WeekdayId, patch: Partial<WeeklySchedule['days'][WeekdayId]>) => {
    setSaved(false)
    setSchedule(prev => ({
      ...prev,
      days: { ...prev.days, [day]: { ...prev.days[day], ...patch } },
    }))
  }, [])

  const useStandard = useCallback(() => {
    setSaved(false)
    setSchedule(() => parseWeeklySchedule(serializeWeeklySchedule(STANDARD_WEEKLY_SCHEDULE)))
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await apiFetch<{ workingHours: string }>('/api/team/schedule', {
        method: 'PUT',
        body: { schedule },
      })
      if (!result.success) throw new Error(result.error || 'save_failed')
      setSaved(true)
      router.refresh()
    } catch {
      setError(t('scheduleSaveError'))
    } finally {
      setSaving(false)
    }
  }, [schedule, router, t])

  return (
    <section className="rounded-xl border border-subtle bg-surface-base">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className="flex h-auto w-full items-center justify-between rounded-xl px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
            {t('scheduleTitle')}
          </span>
          <span className="mt-0.5 block truncate text-sm text-text-secondary">
            {scheduleSummary(schedule)}
          </span>
        </span>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-text-tertiary transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </Button>

      {open && (
        <div className="space-y-3 border-t border-subtle px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{t('scheduleHint')}</p>
            <Button type="button" variant="ghost" size="sm" onClick={useStandard} className="text-xs text-action hover:text-action">
              {t('scheduleStandardButton')}
            </Button>
          </div>

          <div className="space-y-1.5">
            {WEEKDAY_IDS.map(day => {
              const d = schedule.days[day]
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex w-20 shrink-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={e => patchDay(day, { enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-strong text-action focus:ring-action"
                    />
                    <span className={cn('font-medium', d.enabled ? 'text-text-primary' : 'text-text-tertiary')}>
                      {weekdayLabel(day)}
                    </span>
                  </label>
                  <Input
                    type="time"
                    value={d.start}
                    disabled={!d.enabled}
                    onChange={e => patchDay(day, { start: e.target.value })}
                    className="w-28 disabled:opacity-40"
                  />
                  <span className="text-text-tertiary">–</span>
                  <Input
                    type="time"
                    value={d.end}
                    disabled={!d.enabled}
                    onChange={e => patchDay(day, { end: e.target.value })}
                    className="w-28 disabled:opacity-40"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="button" variant="primary" size="sm" onClick={save} disabled={saving}>
              {saving ? t('saving') : t('scheduleSave')}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-action">
                <Check className="h-4 w-4" aria-hidden="true" /> {t('scheduleSaved')}
              </span>
            )}
            {error && <span className="text-sm text-error-700">{error}</span>}
          </div>
        </div>
      )}
    </section>
  )
}
