/**
 * Admin Appointments — list of all service bookings
 *
 * Detail view: {@link SERVICE_APPOINTMENT_ROUTES.adminDetail} (assign repairer, triage).
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { adminTable } from '@/lib/admin-ui'
import { getTranslations } from 'next-intl/server'
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
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'
import { formatDateShort } from '@/lib/date-formats'
import { listAppointments, getAppointmentStats, listActiveRepairers } from '@/lib/services/appointments'
import { AssignRepairerSelect } from './AssignRepairerSelect'

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
  const t = await getTranslations('admin.appointments')
  const params = await searchParams
  const status = params.status || undefined

  const [stats, { appointments }, repairers] = await Promise.all([
    getAppointmentStats(),
    listAppointments({ status, limit: 100 }),
    listActiveRepairers(),
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
      valueColor: 'text-action',
    },
  ]

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Calendar}
      iconColor="amber"
    >
      <AdminStatsGrid items={statCards} />

      {/* Status filter chips — server-rendered Links, no client component */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-text-tertiary">Status:</span>
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
                  ? 'border-action bg-action-muted text-action'
                  : 'text-text-secondary hover:border-strong ${adminInteractive.rowHover}')
              }
            >
              {opt.label}
            </a>
          )
        })}
      </div>

      <div className="rounded-lg border bg-surface-base overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">
              Keine Termine in dieser Ansicht.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-text-tertiary">
                <tr>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Beschreibung</th>
                  <th className="px-4 py-3 font-medium">Dringlichkeit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Techniker</th>
                  <th className="px-4 py-3 font-medium">Erstellt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {appointments.map(row => {
                  const statusBadge = getBookingStatusBadge(row.status ?? '')
                  const urgencyBadge = getUrgencyBadge(row.urgency ?? '')
                  return (
                    <tr key={row.id} className={adminTable.tr}>
                      <td className="px-4 py-3">
                        <Link
                          href={SERVICE_APPOINTMENT_ROUTES.adminDetail(row.id)}
                          className="font-medium text-text-primary hover:text-action"
                        >
                          {row.customer_name || row.customer_email}
                        </Link>
                        {row.customer_name && (
                          <div className="text-xs text-text-tertiary">
                            {row.customer_email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.service_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-tertiary max-w-md">
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
                      <td className="px-4 py-3">
                        {row.repairer_name ? (
                          <span className="text-text-secondary">{row.repairer_name}</span>
                        ) : (
                          <AssignRepairerSelect
                            appointmentId={row.id}
                            alreadyAssigned={!!row.repairer_id}
                            repairers={repairers}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">
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
