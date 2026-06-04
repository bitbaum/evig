/**
 * Admin Appointments — list of all service bookings
 *
 * The admin-side counterpart to the user "Termin buchen" flow. New bookings
 * arrive here in status `requested`; the stat cards above the table are
 * one-click filters (same pattern as /admin/tasks).
 *
 * Detail/edit lives on the existing /api/appointments/[id] PATCH route; a
 * dedicated detail page is intentionally out of scope for this iteration.
 * The row inline shows enough for triage (customer, service, urgency,
 * created date) and admins act via email or by assigning a repairer.
 */

import { Metadata } from 'next'
import { Calendar, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import {
  BOOKING_STATUS,
  BOOKING_STATUS_BADGES,
  getBookingStatusBadge,
  getUrgencyBadge,
} from '@/config/booking-status'
import { ROUTES } from '@/config/routes'
import { formatDateShort } from '@/lib/date-formats'
import { listAppointments, getAppointmentStats } from '@/lib/services/appointments'

export const metadata: Metadata = {
  title: 'Termine',
  description: 'Service-Termine prüfen und zuweisen.',
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Alle' },
  ...Object.entries(BOOKING_STATUS_BADGES).map(([value, { label }]) => ({ value, label })),
]

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminAppointmentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status || undefined

  const [stats, { appointments }] = await Promise.all([
    getAppointmentStats(),
    listAppointments({ status, limit: 100 }),
  ])

  const statCards: StatCardItem[] = [
    {
      icon: Calendar,
      color: 'gray',
      label: 'Gesamt',
      value: stats.total,
      href: ROUTES.admin.appointments,
    },
    {
      icon: AlertTriangle,
      color: 'red',
      label: 'Angefragt',
      value: stats.requested,
      valueColor: 'text-error-600',
      href: `${ROUTES.admin.appointments}?status=${BOOKING_STATUS.REQUESTED}`,
    },
    {
      icon: Clock,
      color: 'amber',
      label: 'In Bearbeitung',
      value: stats.in_progress,
      valueColor: 'text-warning-600',
      href: `${ROUTES.admin.appointments}?status=${BOOKING_STATUS.IN_PROGRESS}`,
    },
    {
      icon: CheckCircle2,
      color: 'green',
      label: 'Heute erledigt',
      value: stats.completed_today,
      valueColor: 'text-primary-600',
    },
  ]

  return (
    <AdminPageWrapper
      title="Termine"
      description="Service-Termine prüfen und Reparateure zuweisen"
      icon={Calendar}
      iconColor="amber"
    >
      <AdminStatsGrid items={statCards} />

      {/* Status filter chips — server-rendered Links, no client component */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
        {FILTER_OPTIONS.map(opt => {
          const isActive = (status ?? '') === opt.value
          const href = opt.value
            ? `${ROUTES.admin.appointments}?status=${opt.value}`
            : ROUTES.admin.appointments
          return (
            <a
              key={opt.value || 'all'}
              href={href}
              className={
                'px-3 min-h-9 inline-flex items-center rounded-full border transition-colors ' +
                (isActive
                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/[0.08] dark:text-neutral-400 dark:hover:bg-white/[0.04]')
              }
            >
              {opt.label}
            </a>
          )
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white dark:border-white/[0.06] dark:bg-neutral-900 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-300">
              Keine Termine in dieser Ansicht.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-white/[0.02] text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Beschreibung</th>
                  <th className="px-4 py-3 font-medium">Dringlichkeit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Erstellt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {appointments.map(row => {
                  const statusBadge = getBookingStatusBadge(row.status ?? '')
                  const urgencyBadge = getUrgencyBadge(row.urgency ?? '')
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {row.customer_name || row.customer_email}
                        </div>
                        {row.customer_name && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {row.customer_email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {row.service_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-md">
                        <p className="line-clamp-2">{row.description || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyBadge.color}`}>
                          {urgencyBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {row.created_at ? formatDateShort(row.created_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  )
}
