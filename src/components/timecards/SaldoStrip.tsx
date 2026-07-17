'use client'

/**
 * Zeit-/Feriensaldo strip — the numbers people opened the legacy SMALL-Time
 * tool for, now on the Zeiterfassung page itself. Values are DERIVED (see
 * lib/team/saldo); this is display only. Hidden entirely for people without
 * a Pensum (the server passes null).
 */

import { useTranslations } from 'next-intl'
import { Clock4, Plane } from 'lucide-react'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { cn } from '@/lib/utils'

export interface SaldoStripData {
  time: {
    saldoMinutes: number
    monthSollMinutes: number
    monthIstMinutes: number
    monthSaldoMinutes: number
  }
  vacation: {
    entitlementDays: number
    carryoverDays: number
    takenDays: number
    balanceDays: number
    isEstimated: boolean
  }
  scheduleMismatch: boolean
  weeklyMinutes: number
  scheduleWeeklyMinutes: number
}

function signed(formatted: string, minutes: number): string {
  return minutes > 0 ? `+${formatted}` : minutes < 0 ? `−${formatted}` : formatted
}

export function SaldoStrip({ data, compact = false }: { data: SaldoStripData; compact?: boolean }) {
  const t = useTranslations('admin.timecards')
  const { duration } = useTimecardIntl()

  const saldo = data.time.saldoMinutes
  const saldoTone = saldo < -8 * 60 ? 'text-error-600 dark:text-error-400'
    : saldo > 8 * 60 ? 'text-success-700 dark:text-success-400'
      : 'text-text-primary'

  return (
    <section
      className={cn(
        'grid gap-px overflow-hidden rounded-xl border border-subtle bg-surface-raised',
        compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3',
      )}
    >
      <div className={cn('bg-surface-base', compact ? 'p-3' : 'p-4')}>
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          <Clock4 className="h-3.5 w-3.5" aria-hidden="true" /> {t('saldoTime')}
        </p>
        <p className={cn('mt-1 font-mono tabular-nums font-semibold', compact ? 'text-lg' : 'text-2xl', saldoTone)}>
          {signed(duration(Math.abs(saldo)), saldo)}
        </p>
      </div>
      <div className={cn('bg-surface-base', compact ? 'p-3' : 'p-4')}>
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          <Plane className="h-3.5 w-3.5" aria-hidden="true" /> {t('saldoVacation')}
        </p>
        <p className={cn('mt-1 font-mono tabular-nums font-semibold text-text-primary', compact ? 'text-lg' : 'text-2xl')}>
          {t('saldoVacationDays', { days: data.vacation.balanceDays })}
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-text-tertiary">
            {t('saldoVacationDetail', {
              entitlement: data.vacation.entitlementDays + data.vacation.carryoverDays,
              taken: data.vacation.takenDays,
            })}
            {data.vacation.isEstimated && ` · ${t('saldoVacationEstimated')}`}
          </p>
        )}
      </div>
      <div className={cn('bg-surface-base', compact ? 'p-3' : 'p-4')}>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          {t('saldoMonth')}
        </p>
        <p className={cn('mt-1 font-mono tabular-nums font-semibold text-text-primary', compact ? 'text-lg' : 'text-2xl')}>
          {duration(data.time.monthIstMinutes)}
          <span className="text-text-tertiary"> / {duration(data.time.monthSollMinutes)}</span>
        </p>
        {!compact && data.scheduleMismatch && (
          <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-400">
            {t('saldoScheduleMismatch', {
              schedule: duration(data.scheduleWeeklyMinutes),
              contract: duration(data.weeklyMinutes),
            })}
          </p>
        )}
      </div>
    </section>
  )
}
