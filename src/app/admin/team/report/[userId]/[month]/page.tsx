/**
 * /admin/team/report/[userId]/[month] — printable Monatsrapport.
 *
 * One sheet, three audiences: the team member, the accountant (replaces the
 * legacy SMALL-Time PDF), and the referring social worker. Browser
 * print-to-PDF via the print button; `.print-area` in globals.css isolates
 * the sheet from the admin chrome when printing.
 *
 * The DOCUMENT body is deliberately German (official record); UI chrome
 * (print button) is localized.
 */

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getMonthlyReport, REPORT_MONTH_REGEX } from '@/lib/services/report'
import { getTimecardMonthLabel } from '@/lib/team/timecard-period-label'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { formatTimecardDuration, getTimecardEntryCategoryLabel, getTimecardStatusLabel, isAbsenceCategory } from '@/config/timecards'
import { ORG, LOCATIONS } from '@/config/org'
import { PrintButton } from './PrintButton'

export const metadata = { title: 'Monatsrapport' }

export default async function MonthlyReportPage({
  params,
}: {
  params: Promise<{ userId: string; month: string }>
}) {
  const { userId, month } = await params
  if (!REPORT_MONTH_REGEX.test(month)) notFound()

  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/admin')
  const isOwn = session.user.id === userId
  const mayView = isOwn || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
    is_super_admin: session.user.isSuperAdmin,
  }, 'timecards')
  if (!mayView) redirect('/admin?error=no_timecards_access')

  const report = await getMonthlyReport(userId, month)
  if (!report) notFound()

  const monthLabel = getTimecardMonthLabel(`${month}-01`)
  const entries = report.card?.entries ?? []
  const workedMinutes = entries.filter(e => !isAbsenceCategory(e.category)).reduce((s, e) => s + e.duration_minutes, 0)
  const absenceMinutes = entries.filter(e => isAbsenceCategory(e.category)).reduce((s, e) => s + e.duration_minutes, 0)
  const absenceDaysByCategory = new Map<string, number>()
  for (const e of entries) {
    if (!isAbsenceCategory(e.category)) continue
    absenceDaysByCategory.set(e.category, (absenceDaysByCategory.get(e.category) ?? 0) + 1)
  }

  return (
    <div className="print-area mx-auto max-w-3xl space-y-6 bg-surface-base p-6 print:max-w-none print:p-0">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <p className="text-sm text-text-tertiary">
          Monatsrapport — als PDF sichern über «Drucken» (Ziel: «Als PDF speichern»).
        </p>
        <PrintButton />
      </div>

      {/* Letterhead */}
      <header className="border-b-2 border-neutral-900 pb-4 print:border-black">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-text-primary">{ORG.name}</h1>
          <p className="text-sm text-text-secondary">{LOCATIONS.store.full}</p>
        </div>
        <p className="mt-2 text-lg font-semibold text-text-primary">
          Monatsrapport Arbeitszeit — {monthLabel}
        </p>
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
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Soll (Monat)</p>
          <p className="font-mono font-semibold">{report.saldo ? formatTimecardDuration(report.saldo.time.monthSollMinutes) : '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Ist (Monat)</p>
          <p className="font-mono font-semibold">{report.saldo ? formatTimecardDuration(report.saldo.time.monthIstMinutes) : formatTimecardDuration(workedMinutes + absenceMinutes)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Zeitsaldo (Ende Monat)</p>
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

      {/* Day table */}
      <section>
        <table className="w-full border-collapse text-sm">
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
                <td className="py-1 text-text-secondary">{e.description ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
