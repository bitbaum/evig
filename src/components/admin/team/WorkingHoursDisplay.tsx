'use client'

/**
 * Read-only rendering of a team member's working hours.
 *
 * `working_hours` stores the serialized WeeklySchedule JSON (see
 * lib/team/schedule.ts). This renders it as a human weekly plan — the raw
 * JSON used to be printed verbatim on the profile page. Legacy free-text
 * values (pre-schedule era) are shown as-is.
 */

import {
  parseWeeklySchedule,
  summarizeWeeklySchedule,
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
} from '@/lib/team/schedule'

export function WorkingHoursDisplay({ value }: { value: string }) {
  const looksStructured = value.trim().startsWith('{')
  if (!looksStructured) {
    return <p className="text-text-secondary text-sm whitespace-pre-wrap">{value}</p>
  }

  const schedule = parseWeeklySchedule(value)
  const enabledDays = WEEKDAY_IDS.filter(day => schedule.days[day].enabled)

  if (enabledDays.length === 0) {
    return <p className="text-text-muted text-sm">Kein Standardschedule hinterlegt</p>
  }

  return (
    <div className="space-y-1.5">
      <dl className="space-y-0.5">
        {WEEKDAY_IDS.map(day => {
          const d = schedule.days[day]
          return (
            <div key={day} className="flex items-baseline gap-3 text-sm">
              <dt className="w-7 shrink-0 font-medium text-text-secondary">{WEEKDAY_LABELS[day]}</dt>
              <dd className={d.enabled ? 'text-text-secondary tabular-nums' : 'text-text-muted'}>
                {d.enabled
                  ? `${d.start}–${d.end}${d.break_minutes > 0 ? ` · ${d.break_minutes} Min. Pause` : ''}`
                  : '—'}
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="text-xs text-text-tertiary">{summarizeWeeklySchedule(schedule)}</p>
    </div>
  )
}
