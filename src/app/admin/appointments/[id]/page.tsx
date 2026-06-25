/**
 * Admin Service Appointment Detail
 *
 * Deep link target for notification hrefs and admin list rows.
 * Assignment uses the same AssignRepairerSelect as the list view.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, User, Wrench } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'
import {
  getBookingStatusBadge,
  getUrgencyBadge,
} from '@/config/booking-status'
import { formatDateTime, formatDateShort } from '@/lib/date-formats'
import { getAppointmentById, listActiveRepairers } from '@/lib/services/appointments'
import { AssignRepairerSelect } from '../AssignRepairerSelect'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const appointment = await getAppointmentById(id)
  return {
    title: appointment?.service_name ? `Termin — ${appointment.service_name}` : 'Termin',
    description: 'Service-Termin prüfen und Techniker zuweisen.',
  }
}

export default async function AdminAppointmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const [appointment, repairers] = await Promise.all([
    getAppointmentById(id),
    listActiveRepairers(),
  ])

  if (!appointment) notFound()

  const statusBadge = getBookingStatusBadge(appointment.status ?? '')
  const urgencyBadge = getUrgencyBadge(appointment.urgency ?? '')

  return (
    <AdminPageWrapper
      title={appointment.service_name || 'Service-Termin'}
      description={`Angelegt ${appointment.created_at ? formatDateShort(appointment.created_at) : '—'}`}
      icon={Calendar}
      iconColor="amber"
    >
      <Link
        href={ROUTES.admin.appointments}
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Terminliste
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-surface-base p-6 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">Status</h2>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${urgencyBadge.color}`}>
              {urgencyBadge.label}
            </span>
          </div>
          {appointment.description && (
            <p className="text-text-secondary whitespace-pre-wrap">{appointment.description}</p>
          )}
          {appointment.device_info && (
            <p className="text-sm text-text-tertiary">
              <span className="font-medium text-text-secondary">Gerät: </span>
              {appointment.device_info}
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-surface-base p-6 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary flex items-center gap-2">
            <User className="h-4 w-4" />
            Kunde
          </h2>
          <div>
            <p className="font-medium text-text-primary">{appointment.customer_name || '—'}</p>
            <p className="text-sm text-text-tertiary">{appointment.customer_email}</p>
          </div>
          <Link
            href={SERVICE_APPOINTMENT_ROUTES.detail(id)}
            className="text-sm text-action hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kundenansicht öffnen
          </Link>
        </section>

        <section className="rounded-lg border bg-surface-base p-6 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Techniker
          </h2>
          {appointment.repairer_name ? (
            <div>
              <p className="font-medium text-text-primary">{appointment.repairer_name}</p>
              {appointment.business_name && (
                <p className="text-sm text-text-tertiary">{appointment.business_name}</p>
              )}
            </div>
          ) : (
            <AssignRepairerSelect
              appointmentId={appointment.id}
              alreadyAssigned={!!appointment.repairer_id}
              repairers={repairers}
            />
          )}
        </section>

        <section className="rounded-lg border bg-surface-base p-6 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">Termine</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-tertiary">Bevorzugt</dt>
              <dd className="text-text-secondary">
                {appointment.preferred_date ? formatDateTime(appointment.preferred_date) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-tertiary">Bestätigt</dt>
              <dd className="text-text-secondary">
                {appointment.confirmed_date ? formatDateTime(appointment.confirmed_date) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-tertiary">Aktualisiert</dt>
              <dd className="text-text-secondary">
                {appointment.updated_at ? formatDateTime(appointment.updated_at) : '—'}
              </dd>
            </div>
          </dl>
        </section>

        {(appointment.is_home_visit || appointment.visit_address || appointment.visit_city) && (
          <section className="rounded-lg border bg-surface-base p-6 space-y-3 lg:col-span-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ort
            </h2>
            <p className="text-text-secondary">
              {[appointment.visit_address, appointment.visit_city].filter(Boolean).join(', ') || 'Hausbesuch'}
            </p>
          </section>
        )}

        {(appointment.quoted_price_chf != null || appointment.diagnosis_notes || appointment.completion_notes) && (
          <section className="rounded-lg border bg-surface-base p-6 space-y-3 lg:col-span-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">Angebot & Abschluss</h2>
            {appointment.quoted_price_chf != null && (
              <p className="text-text-secondary">
                Angebot: <span className="font-medium">CHF {appointment.quoted_price_chf}</span>
              </p>
            )}
            {appointment.diagnosis_notes && (
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{appointment.diagnosis_notes}</p>
            )}
            {appointment.completion_notes && (
              <p className="text-sm text-text-tertiary whitespace-pre-wrap">{appointment.completion_notes}</p>
            )}
          </section>
        )}
      </div>
    </AdminPageWrapper>
  )
}
