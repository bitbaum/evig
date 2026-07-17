'use client'

/**
 * Personal monthly reminder — one quiet row: «Erinnere mich jeweils am X.»
 * Saved instantly on change; the timecard-reminders cron sends an in-app
 * + e-mail nudge on that day if the month isn't submitted yet.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BellRing, Check } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { apiFetch } from '@/lib/api/client'

const DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28]

export function ReminderSetting({ initialDay }: { initialDay: number | null }) {
  const t = useTranslations('admin.timecards')
  const [day, setDay] = useState<number | null>(initialDay)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  const save = async (next: number | null) => {
    setDay(next)
    setSaved(false)
    setError(false)
    const res = await apiFetch('/api/team/reminder', { method: 'PUT', body: { day: next } })
    if (res.success) {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } else {
      setError(true)
    }
  }

  // Keep a nonstandard stored day (e.g. set by HR) selectable.
  const options = day !== null && !DAY_OPTIONS.includes(day)
    ? [...DAY_OPTIONS, day].sort((a, b) => a - b)
    : DAY_OPTIONS

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-text-tertiary">
      <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <label htmlFor="zeiterfassung-reminder" className="whitespace-nowrap">
        {t('reminderLabel')}
      </label>
      <Select
        id="zeiterfassung-reminder"
        value={day === null ? '' : String(day)}
        onChange={e => save(e.target.value === '' ? null : Number(e.target.value))}
        className="h-8 w-auto min-w-28 py-1 text-sm"
      >
        <option value="">{t('reminderOff')}</option>
        {options.map(d => (
          <option key={d} value={d}>{t('reminderDayOption', { day: d })}</option>
        ))}
      </Select>
      {saved && (
        <span className="inline-flex items-center gap-1 text-action">
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> {t('scheduleSaved')}
        </span>
      )}
      {error && <span className="text-error-600">{t('reminderError')}</span>}
    </div>
  )
}
