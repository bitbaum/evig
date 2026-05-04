'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  ArrowLeft,
  Users,
  MapPin,
  GraduationCap,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  DollarSign,
  Star,
  MessageSquare
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort, formatDateTimeWithWeekday } from '@/lib/date-formats'
import {
  WORKSHOP_REGISTRATION_STATUS,
  WORKSHOP_REGISTRATION_STATUS_LABELS,
  WORKSHOP_REGISTRATION_STATUS_COLORS,
  WORKSHOP_PAYMENT_STATUS,
  WORKSHOP_PAYMENT_STATUS_LABELS,
  WORKSHOP_PAYMENT_STATUS_COLORS,
} from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import Heading from '@/components/admin/AdminHeading'
import type { WorkshopInstanceWithDetails } from '@/components/workshops/types'

// Admin-specific registration view with user details
interface Registration {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  registered_at: string
  attended: boolean
  rating: number | null
  feedback: string | null
}

export default function AdminWorkshopInstanceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [instance, setInstance] = useState<WorkshopInstanceWithDetails | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInstanceDetails = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ instance: WorkshopInstanceWithDetails; registrations: Registration[] }>(
        `/api/admin/workshops/instances/${id}`,
      )

      if (result.success && result.data) {
        setInstance(result.data.instance)
        setRegistrations(result.data.registrations)
      } else {
        if (result.error) logger.warn('Error loading instance details', { error: result.error })
        setError(result.error || 'Termin nicht gefunden')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (status === 'authenticated') {
      loadInstanceDetails()
    }
  }, [status, loadInstanceDetails])

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    const result = await apiFetch<unknown>(`/api/admin/workshops/registrations/${registrationId}`, {
      method: 'PUT',
      body: { status: newStatus },
    })

    if (result.success) {
      loadInstanceDetails()
    } else {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
  }

  const getStatusBadge = (status: string) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${WORKSHOP_REGISTRATION_STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-800'}`}>
      {WORKSHOP_REGISTRATION_STATUS_LABELS[status] ?? status}
    </span>
  )

  const getPaymentBadge = (paymentStatus: string) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${WORKSHOP_PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-neutral-100 text-neutral-800'}`}>
      {WORKSHOP_PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
    </span>
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-info-600" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-error-50 border border-error-200 rounded-lg p-8 text-center">
            <p className="text-error-800">{error || 'Termin nicht gefunden'}</p>
            <Link
              href="/admin/workshops/instances"
              className="mt-4 inline-flex items-center text-error-600 hover:text-error-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPast = new Date(instance.start_date) < new Date()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin/workshops/instances"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-info-600" />
                <Heading level={1} className="text-2xl font-bold text-neutral-900">{instance.workshop_title}</Heading>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateTimeWithWeekday(instance.start_date)}
                </div>
                {instance.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {instance.location}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-neutral-900">
                  {instance.current_participants}/{instance.max_participants || '∞'}
                </div>
                <div className="text-sm text-neutral-600">Teilnehmer</div>
              </div>
              {getStatusBadge(instance.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED ? (isPast ? WORKSHOP_INSTANCE_STATUS.COMPLETED : WORKSHOP_INSTANCE_STATUS.SCHEDULED) : instance.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-error-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {registrations.filter(r => r.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED || r.status === WORKSHOP_REGISTRATION_STATUS.ATTENDED).length}
                </div>
                <div className="text-sm text-neutral-600">Bestätigt</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {registrations.filter(r => r.status === WORKSHOP_REGISTRATION_STATUS.PENDING).length}
                </div>
                <div className="text-sm text-neutral-600">Ausstehend</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error-100 rounded-lg">
                <XCircle className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {registrations.filter(r => r.status === WORKSHOP_REGISTRATION_STATUS.CANCELLED).length}
                </div>
                <div className="text-sm text-neutral-600">Abgesagt</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  CHF {(registrations
                    .filter(r => r.payment_status === WORKSHOP_PAYMENT_STATUS.PAID && r.payment_amount_cents)
                    .reduce((sum, r) => sum + (r.payment_amount_cents || 0), 0) / 100
                  ).toFixed(0)}
                </div>
                <div className="text-sm text-neutral-600">Einnahmen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-neutral-200">
            <Heading level={2} className="text-lg font-semibold text-neutral-900">
              Anmeldungen ({registrations.length})
            </Heading>
          </div>

          {registrations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">Noch keine Anmeldungen</Heading>
              <p className="text-neutral-600">
                Sobald sich jemand anmeldet, erscheinen die Daten hier.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Teilnehmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Zahlung</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Angemeldet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Feedback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-neutral-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-neutral-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900">{reg.user_name}</div>
                            <div className="text-sm text-neutral-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {reg.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getPaymentBadge(reg.payment_status)}
                          {reg.payment_amount_cents && reg.payment_amount_cents > 0 && (
                            <span className="text-sm text-neutral-600">
                              CHF {(reg.payment_amount_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {formatDateShort(reg.registered_at)}
                      </td>
                      <td className="px-6 py-4">
                        {reg.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                            <span className="text-sm font-medium">{reg.rating}/5</span>
                          </div>
                        )}
                        {reg.feedback && (
                          <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{reg.feedback}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {reg.status === WORKSHOP_REGISTRATION_STATUS.PENDING && (
                            <>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, WORKSHOP_REGISTRATION_STATUS.CONFIRMED)}
                                className="text-primary-600 hover:text-primary-800 text-sm"
                              >
                                Bestätigen
                              </button>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, WORKSHOP_REGISTRATION_STATUS.CANCELLED)}
                                className="text-error-600 hover:text-error-800 text-sm"
                              >
                                Absagen
                              </button>
                            </>
                          )}
                          {reg.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED && isPast && (
                            <>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, WORKSHOP_REGISTRATION_STATUS.ATTENDED)}
                                className="text-info-600 hover:text-info-800 text-sm"
                              >
                                Teilgenommen
                              </button>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, WORKSHOP_REGISTRATION_STATUS.NO_SHOW)}
                                className="text-neutral-600 hover:text-neutral-800 text-sm"
                              >
                                Nicht erschienen
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {instance.notes && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-2">Interne Notizen</Heading>
            <p className="text-neutral-600">{instance.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
