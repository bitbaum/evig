'use client'

import {
  CONTACT_METHOD_OPTIONS,
  CONTACT_METHOD_LABELS,
  type ContactMethod,
} from '@/config/team'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  type TimecardEntryCategory,
} from '@/config/timecards'
import {
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  applyStandardSchedule,
  getScheduleWeeklyMinutes,
  parseWeeklySchedule,
  serializeWeeklySchedule,
  summarizeWeeklySchedule,
  type WeekdayId,
} from '@/lib/team/schedule'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string) => void
}

export function TeamAvailabilitySection({ form, onChange }: Props) {
  const schedule = parseWeeklySchedule(form.working_hours)
  const weeklyMinutes = getScheduleWeeklyMinutes(schedule)
  const weeklyHours = Math.floor(weeklyMinutes / 60)
  const remainingMinutes = weeklyMinutes % 60
  const weeklyDuration = remainingMinutes === 0
    ? `${weeklyHours} Std.`
    : `${weeklyHours} Std. ${remainingMinutes} Min.`

  const updateScheduleDay = (
    day: WeekdayId,
    field: 'enabled' | 'start' | 'end' | 'break_minutes' | 'category',
    value: string | boolean | number
  ) => {
    onChange('working_hours', serializeWeeklySchedule({
      ...schedule,
      days: {
        ...schedule.days,
        [day]: {
          ...schedule.days[day],
          [field]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-white/[0.06] dark:bg-neutral-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Offizieller Standardschedule
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {summarizeWeeklySchedule(schedule)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange('working_hours', applyStandardSchedule())}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
          >
            Mo-Fr 09-17
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {WEEKDAY_IDS.map(day => {
            const daySchedule = schedule.days[day]
            return (
              <div
                key={day}
                className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 rounded-lg border border-neutral-200 bg-white p-2 dark:border-white/[0.06] dark:bg-neutral-900 md:grid-cols-[44px_92px_92px_92px_minmax(140px,1fr)]"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={(e) => updateScheduleDay(day, 'enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {WEEKDAY_LABELS[day]}
                </label>
                <input
                  type="time"
                  value={daySchedule.start}
                  onChange={(e) => updateScheduleDay(day, 'start', e.target.value)}
                  disabled={!daySchedule.enabled}
                  aria-label={`${WEEKDAY_LABELS[day]} Startzeit`}
                  className="min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:disabled:bg-neutral-900"
                />
                <input
                  type="time"
                  value={daySchedule.end}
                  onChange={(e) => updateScheduleDay(day, 'end', e.target.value)}
                  disabled={!daySchedule.enabled}
                  aria-label={`${WEEKDAY_LABELS[day]} Endzeit`}
                  className="min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:disabled:bg-neutral-900"
                />
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={daySchedule.break_minutes}
                  onChange={(e) => updateScheduleDay(day, 'break_minutes', Number(e.target.value))}
                  disabled={!daySchedule.enabled}
                  aria-label={`${WEEKDAY_LABELS[day]} Pause in Minuten`}
                  className="min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:disabled:bg-neutral-900"
                />
                <select
                  value={daySchedule.category}
                  onChange={(e) => updateScheduleDay(day, 'category', e.target.value)}
                  disabled={!daySchedule.enabled}
                  aria-label={`${WEEKDAY_LABELS[day]} Kategorie`}
                  className="min-w-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:disabled:bg-neutral-900"
                >
                  {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>
                      {TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory]}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Standard: {weeklyDuration}/Woche. Zeitkarten werden daraus vorausgefüllt und müssen nur geprüft werden.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Bevorzugte Kontaktart" htmlFor="preferred-contact">
          <Select
            id="preferred-contact"
            value={form.preferred_contact}
            onChange={(e) => onChange('preferred_contact', e.target.value)}
          >
            {CONTACT_METHOD_OPTIONS.map(method => (
              <option key={method} value={method}>
                {CONTACT_METHOD_LABELS[method as ContactMethod]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Telefon" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+41 79 123 45 67"
          />
        </FormField>

        <FormField label="Allgemeine Verfügbarkeit" className="md:col-span-2">
          <Textarea
            value={form.availability}
            onChange={(e) => onChange('availability', e.target.value)}
            rows={2}
            placeholder="z.B. Ferien, Ausnahmen oder flexible Einsätze"
          />
        </FormField>
      </div>
    </div>
  )
}
