'use client'

/**
 * Zeit-/Feriensaldo strip — the numbers people opened the legacy SMALL-Time
 * tool for, now on the Zeiterfassung page itself. Values are DERIVED (see
 * lib/team/saldo); this is display only. Hidden entirely for people without
 * a Pensum (the server passes null).
 */

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Clock4, Plane, ArrowRight } from 'lucide-react'
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

export function SaldoStrip({
  data,
  compact = false,
  ownView = false,
  reportHref,
}: {
  data: SaldoStripData
  compact?: boolean
  /** Own Zeiterfassung page: show the "where do I change this?" links. */
  ownView?: boolean
  /** Monatsrapport link — makes the Zeitsaldo tile clickable ("what is this number?"). */
  reportHref?: string
}) {
  const t = useTranslations('admin.timecards')
  const { duration, durationCompact } = useTimecardIntl()

  const saldo = data.time.saldoMinutes
  const saldoTone = saldo < -8 * 60 ? 'text-error-600 dark:text-error-400'
    : saldo > 8 * 60 ? 'text-success-700 dark:text-success-400'
      : 'text-text-primary'
  // A bare "−44 h" says nothing — always pair the number with the sentence
  // that explains it, and link to the Monatsrapport that shows the ledger.
  const saldoExplain = saldo < 0
    ? t('saldoTimeExplainMinus', { amount: duration(Math.abs(saldo)) })
    : saldo > 0
      ? t('saldoTimeExplainPlus', { amount: duration(saldo) })
      : t('saldoTimeExplainZero')

  const saldoTileInner = (
    <>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary sm:text-[11px]">
        <Clock4 className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" /> {t('saldoTime')}
      </p>
      <p className={cn('mt-1 font-mono tabular-nums font-semibold', compact ? 'text-lg' : 'text-base sm:text-2xl', saldoTone)}>
        <span className="sm:hidden">{signed(durationCompact(Math.abs(saldo)), saldo)}</span>
        <span className="hidden sm:inline">{signed(duration(Math.abs(saldo)), saldo)}</span>
      </p>
      {!compact && (
        <p className="mt-0.5 hidden text-xs text-text-tertiary sm:block">{saldoExplain}</p>
      )}
      {!compact && reportHref && (
        <span className="mt-1.5 hidden items-center gap-1 text-xs font-medium text-action sm:inline-flex">
          {t('saldoReportLink')} <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
    </>
  )

  return (
    <section
      className={cn(
        'grid gap-px overflow-hidden rounded-xl border border-subtle bg-surface-raised',
        // Always 3 columns — on phones a tight glance line, never a stats wall.
        'grid-cols-3',
      )}
    >
      {reportHref ? (
        <Link
          href={reportHref}
          title={saldoExplain}
          className={cn('block bg-surface-base transition-colors hover:bg-surface-raised', compact ? 'p-3' : 'p-3 sm:p-4')}
        >
          {saldoTileInner}
        </Link>
      ) : (
        <div title={saldoExplain} className={cn('bg-surface-base', compact ? 'p-3' : 'p-3 sm:p-4')}>
          {saldoTileInner}
        </div>
      )}
      <div className={cn('bg-surface-base', compact ? 'p-3' : 'p-3 sm:p-4')}>
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary sm:text-[11px]">
          <Plane className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" /> {t('saldoVacation')}
        </p>
        <p className={cn('mt-1 font-mono tabular-nums font-semibold text-text-primary', compact ? 'text-lg' : 'text-base sm:text-2xl')}>
          {t('saldoVacationDays', { days: data.vacation.balanceDays })}
        </p>
        {!compact && (
          <p className="mt-0.5 hidden text-xs text-text-tertiary sm:block">
            {t('saldoVacationDetail', {
              entitlement: data.vacation.entitlementDays,
              taken: data.vacation.takenDays,
            })}
            {data.vacation.carryoverDays !== 0 &&
              ` · ${t('saldoVacationCarryover', { days: data.vacation.carryoverDays > 0 ? `+${data.vacation.carryoverDays}` : String(data.vacation.carryoverDays) })}`}
            {data.vacation.isEstimated && ` · ${t('saldoVacationEstimated')}`}
          </p>
        )}
        {!compact && ownView && (
          <a href="#abwesenheit" className="mt-1.5 hidden items-center gap-1 text-xs font-medium text-action hover:underline sm:inline-flex">
            {t('saldoRequestAbsence')} <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
      <div className={cn('bg-surface-base', compact ? 'p-3' : 'p-3 sm:p-4')}>
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary sm:text-[11px]">
          {t('saldoMonth')}
        </p>
        <p className={cn('mt-1 font-mono tabular-nums font-semibold text-text-primary', compact ? 'text-lg' : 'text-base sm:text-2xl')}>
          <span className="sm:hidden">
            {durationCompact(data.time.monthIstMinutes)}
            <span className="text-text-tertiary"> / {durationCompact(data.time.monthSollMinutes)}</span>
          </span>
          <span className="hidden sm:inline">
            {duration(data.time.monthIstMinutes)}
            <span className="text-text-tertiary"> / {duration(data.time.monthSollMinutes)}</span>
          </span>
        </p>
        {!compact && data.scheduleMismatch && (
          <div className="mt-0.5 text-xs text-warning-700 dark:text-warning-400">
            {t('saldoScheduleMismatch', {
              schedule: duration(data.scheduleWeeklyMinutes),
              contract: duration(data.weeklyMinutes),
            })}
            {ownView && (
              <span className="mt-0.5 block space-x-3">
                <a href="#arbeitsplan" className="font-medium text-action hover:underline">
                  {t('saldoFixPlan')}
                </a>
                <Link href="/admin/team/me" className="font-medium text-action hover:underline">
                  {t('saldoPensumQuestion')}
                </Link>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
