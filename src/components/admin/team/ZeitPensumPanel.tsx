'use client'

/**
 * Zeit & Pensum management (timecards permission) — lives on the team
 * profile's Zeiterfassung tab, right under the saldo it explains. This is
 * where the "magic numbers" stop being magic: Pensum steps, Ferienanspruch
 * per year, and the opening balance are all visible and editable here, and
 * the saldo above is DERIVED from them.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronRight, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { cn } from '@/lib/utils'

interface ZeitData {
  periods: { id: string; valid_from: string; weekly_minutes: number; notes: string | null }[]
  entitlements: { year: number; days: string; carryover_days: string }[]
  opening: { minutes: number; date: string | null } | null
}

export function ZeitPensumPanel({ userId, onChanged }: { userId: string; onChanged?: () => void }) {
  const t = useTranslations('admin.timecards')
  const { duration } = useTimecardIntl()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ZeitData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const year = new Date().getFullYear()
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodHours, setPeriodHours] = useState('')
  const [entDays, setEntDays] = useState('')
  const [entCarry, setEntCarry] = useState('0')
  const [openMinutes, setOpenMinutes] = useState('')
  const [openDate, setOpenDate] = useState('')

  const load = useCallback(async () => {
    const res = await apiFetch<ZeitData>(`/api/admin/team/zeit/${userId}`)
    if (res.success && res.data) {
      setData(res.data)
      const ent = res.data.entitlements.find(e => e.year === year)
      if (ent) { setEntDays(String(Number(ent.days))); setEntCarry(String(Number(ent.carryover_days))) }
      if (res.data.opening) {
        setOpenMinutes(String(Math.round(res.data.opening.minutes / 60 * 10) / 10))
        setOpenDate(res.data.opening.date ?? '')
      }
    }
  }, [userId, year])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data load on open
    if (open && !data) void load()
  }, [open, data, load])

  const post = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    const res = await apiFetch(`/api/admin/team/zeit/${userId}`, { method: 'POST', body })
    setBusy(false)
    if (!res.success) { setError(res.error ?? t('saveFailed')); return false }
    await load()
    onChanged?.()
    return true
  }

  return (
    <section className="rounded-xl border border-subtle bg-surface-base">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className="flex h-auto w-full items-center justify-between rounded-xl px-4 py-3 text-left"
      >
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
          {t('zeitPanelTitle')}
        </span>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-text-tertiary transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </Button>

      {open && (
        <div className="space-y-5 border-t border-subtle px-4 py-4 text-sm">
          {error && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-error-700">{error}</p>}

          {/* Pensum steps */}
          <div>
            <p className="mb-1.5 font-medium text-text-primary">{t('zeitPanelPensum')}</p>
            {data?.periods.length ? (
              <ul className="mb-2 space-y-0.5 text-text-secondary">
                {data.periods.map(p => (
                  <li key={p.id} className="font-mono tabular-nums">
                    {t('zeitPanelPensumRow', { from: p.valid_from, hours: duration(p.weekly_minutes) })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-text-tertiary">{t('zeitPanelNoPensum')}</p>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelValidFrom')}</span>
                <Input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className="mt-0.5 h-9" />
              </label>
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelWeeklyHours')}</span>
                <Input type="number" min="0" max="100" step="0.5" value={periodHours} onChange={e => setPeriodHours(e.target.value)} className="mt-0.5 h-9 w-24" />
              </label>
              <Button
                type="button" variant="outline" size="sm" disabled={busy || !periodFrom || !periodHours}
                onClick={() => post({ action: 'period', valid_from: periodFrom, weekly_hours: Number(periodHours) })}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {t('zeitPanelAddPeriod')}
              </Button>
            </div>
          </div>

          {/* Vacation entitlement for the current year */}
          <div>
            <p className="mb-1.5 font-medium text-text-primary">{t('zeitPanelEntitlement', { year })}</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelDays')}</span>
                <Input type="number" min="0" max="60" step="0.5" value={entDays} onChange={e => setEntDays(e.target.value)} className="mt-0.5 h-9 w-24" />
              </label>
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelCarryover')}</span>
                <Input type="number" min="-30" max="30" step="0.5" value={entCarry} onChange={e => setEntCarry(e.target.value)} className="mt-0.5 h-9 w-24" />
              </label>
              <Button
                type="button" variant="outline" size="sm" disabled={busy || entDays === ''}
                onClick={() => post({ action: 'entitlement', year, days: Number(entDays), carryover_days: Number(entCarry || 0) })}
              >
                {t('save')}
              </Button>
            </div>
          </div>

          {/* Opening balance (cutover) */}
          <div>
            <p className="mb-1.5 font-medium text-text-primary">{t('zeitPanelOpening')}</p>
            <p className="mb-1.5 text-xs text-text-tertiary">{t('zeitPanelOpeningHint')}</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelOpeningHours')}</span>
                <Input type="number" step="0.1" value={openMinutes} onChange={e => setOpenMinutes(e.target.value)} className="mt-0.5 h-9 w-28" />
              </label>
              <label className="block">
                <span className="text-xs text-text-tertiary">{t('zeitPanelOpeningDate')}</span>
                <Input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} className="mt-0.5 h-9" />
              </label>
              <Button
                type="button" variant="outline" size="sm" disabled={busy || openDate === '' || openMinutes === ''}
                onClick={() => post({ action: 'opening', minutes: Math.round(Number(openMinutes) * 60), date: openDate })}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
