/**
 * MonthlyReportSheet — the printable Monatsrapport document body, shared by the
 * admin report page (/admin/team/report/…) and the public share page (/r/[token]).
 * Presentational only: a pure function of the report, no session, no data
 * fetching. The `.print-area` wrapper is what globals.css isolates for print.
 *
 * Body is deliberately German (official ArG record).
 */

import { getTimecardMonthLabel } from '@/lib/team/timecard-period-label'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { SCHEDULE_FILL_DESCRIPTION } from '@/lib/team/schedule'
import { formatTimecardDuration, getTimecardEntryCategoryLabel, getTimecardStatusLabel, isAbsenceCategory } from '@/config/timecards'
import { ORG, LOCATIONS } from '@/config/org'
import type { MonthlyReport } from '@/lib/services/report'

export function MonthlyReportSheet({ report }: { report: MonthlyReport }) {
  const monthLabel = getTimecardMonthLabel(`${report.month}-01`)
  // Only days up to the as-of date are "worked" — a running month must not
  // present pre-filled future days as done (they'd also inflate the totals).
  const allEntries = report.card?.entries ?? []
  const entries = allEntries.filter(e => e.work_date <= report.asOfDate)
  const futureCount = allEntries.length - entries.length
  const asOfLabel = getDisplayDate(report.asOfDate)
  const workedMinutes = entries.filter(e => !isAbsenceCategory(e.category)).reduce((s, e) => s + e.duration_minutes, 0)
  const absenceMinutes = entries.filter(e => isAbsenceCategory(e.category)).reduce((s, e) => s + e.duration_minutes, 0)
  const absenceDaysByCategory = new Map<string, number>()
  for (const e of entries) {
    if (!isAbsenceCategory(e.category)) continue
    absenceDaysByCategory.set(e.category, (absenceDaysByCategory.get(e.category) ?? 0) + 1)
  }

  return (
    <div className="print-area mx-auto max-w-3xl space-y-6 bg-surface-base p-6 print:max-w-none print:p-0">
      {/* Letterhead */}
      <header className="border-b-2 border-neutral-900 pb-4 print:border-black">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-text-primary">{ORG.name}</h1>
          <p className="text-sm text-text-secondary">{LOCATIONS.store.full}</p>
        </div>
        <p className="mt-2 text-lg font-semibold text-text-primary">
          Monatsrapport Arbeitszeit — {monthLabel}
        </p>
        {report.isInterim && (
          <p className="mt-1 text-sm font-medium text-warning-700 dark:text-warning-400">
            Zwischenstand per {asOfLabel} — der Monat läuft noch; Zahlen bis zu diesem Tag.
          </p>
        )}
      </header>

      {/* Person + status */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <p><span className="text-text-tertiary">Name:</span> <strong>{report.person.name}</strong></p>
        <p><span className="text-text-tertiary">Funktion:</span> {report.person.position ?? '—'}</p>
        <p><span className="text-text-tertiary">Status Zeitkarte:</span> {report.card ? getTimecardStatusLabel(report.card.status) : 'Keine Zeitkarte erfasst'}</p>
        <p>
          <span className="text-text-tertiary">Geprüft durch:</span>{' '}
          {report.reviewerName ? `${report.reviewerName}` : '—'}
        </p>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-300 p-4 text-sm sm:grid-cols-4 print:border-black">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Soll {report.isInterim ? `(bis ${asOfLabel})` : '(Monat)'}</p>
          <p className="font-mono font-semibold">{report.saldo ? formatTimecardDuration(report.saldo.time.monthSollMinutes) : '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Ist {report.isInterim ? `(bis ${asOfLabel})` : '(Monat)'}</p>
          <p className="font-mono font-semibold">{report.saldo ? formatTimecardDuration(report.saldo.time.monthIstMinutes) : formatTimecardDuration(workedMinutes + absenceMinutes)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Zeitsaldo {report.isInterim ? `(per ${asOfLabel})` : '(Ende Monat)'}</p>
          <p className="font-mono font-semibold">
            {report.saldo
              ? `${report.saldo.time.saldoMinutes < 0 ? '−' : '+'}${formatTimecardDuration(Math.abs(report.saldo.time.saldoMinutes))}`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Feriensaldo</p>
          <p className="font-mono font-semibold">{report.saldo ? `${report.saldo.vacation.balanceDays} Tage` : '—'}</p>
        </div>
      </section>

      {/* Absence breakdown — the line social workers ask about first. */}
      {absenceDaysByCategory.size > 0 && (
        <section className="text-sm">
          <p className="font-semibold text-text-primary">Absenzen</p>
          <p className="text-text-secondary">
            {[...absenceDaysByCategory.entries()]
              .map(([cat, days]) => `${getTimecardEntryCategoryLabel(cat)}: ${days} ${days === 1 ? 'Tag' : 'Tage'}`)
              .join(' · ')}
          </p>
        </section>
      )}

      {/* Day table — scrolls inside its own container on narrow screens
          (page must never scroll horizontally); print shows it in full. */}
      <section className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[560px] border-collapse text-sm print:min-w-0">
          <thead>
            <tr className="border-b border-neutral-400 text-left text-xs uppercase tracking-wide text-text-tertiary print:border-black">
              <th className="py-1.5 pr-2 font-medium">Datum</th>
              <th className="py-1.5 pr-2 font-medium">Kategorie</th>
              <th className="py-1.5 pr-2 font-medium">Zeiten</th>
              <th className="py-1.5 pr-2 text-right font-medium">Stunden</th>
              <th className="py-1.5 font-medium">Bemerkung</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-text-tertiary">Keine Einträge für diesen Monat.</td></tr>
            ) : entries.map(e => (
              <tr key={`${e.work_date}-${e.id ?? ''}`} className="border-b border-neutral-200 print:border-neutral-400">
                <td className="py-1 pr-2 font-mono tabular-nums whitespace-nowrap">{getDisplayDate(e.work_date)}</td>
                <td className="py-1 pr-2">{getTimecardEntryCategoryLabel(e.category)}</td>
                <td className="py-1 pr-2 font-mono tabular-nums">
                  {e.start_time && e.end_time ? `${e.start_time}–${e.end_time}${e.break_minutes ? ` (${e.break_minutes}′ Pause)` : ''}` : '—'}
                </td>
                <td className="py-1 pr-2 text-right font-mono tabular-nums">{formatTimecardDuration(e.duration_minutes)}</td>
                {/* The plan-fill source marker is internal noise on a document —
                    show only genuine, hand-written remarks. */}
                <td className="py-1 text-text-secondary">{e.description === SCHEDULE_FILL_DESCRIPTION ? '' : (e.description ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {futureCount > 0 && (
          <p className="mt-2 text-xs text-text-tertiary">
            {futureCount} geplante {futureCount === 1 ? 'Tag' : 'Tage'} nach dem {asOfLabel} noch nicht berücksichtigt (Monat läuft noch).
          </p>
        )}
        {report.holidays.length > 0 && (
          <p className="mt-2 text-xs text-text-tertiary">
            Feiertage im {monthLabel}: {report.holidays.map(h => `${getDisplayDate(h.date)} (${h.name})`).join(', ')} — reduzieren die Sollzeit automatisch.
          </p>
        )}
      </section>

      {/* Signatures */}
      <section className="grid grid-cols-2 gap-12 pt-10 text-sm">
        <div>
          <div className="border-t border-neutral-400 pt-1 print:border-black">Mitarbeiter:in</div>
        </div>
        <div>
          <div className="border-t border-neutral-400 pt-1 print:border-black">{ORG.name} (Begleitung/HR)</div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 pt-2 text-xs text-text-tertiary print:border-neutral-400">
        Erstellt am {getDisplayDate(new Date().toISOString().slice(0, 10))} · {ORG.name} · Arbeitszeit-Dokumentation gemäss Art. 46 ArG / Art. 73 ArGV 1
      </footer>
    </div>
  )
}
