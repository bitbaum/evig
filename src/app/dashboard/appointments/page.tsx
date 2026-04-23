'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { Calendar, Clock, Wrench, AlertCircle, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDateTime } from '@/lib/date-formats'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { BOOKING_STATUS } from '@/config/booking-status'
import { Modal } from '@/components/ui/Modal'
import Heading from '@/components/ui/Heading'

interface ServiceAppointment {
  id: string
  service_name: string
  service_slug: string
  description: string | null
  urgency: string
  status: string
  preferred_date: string | null
  confirmed_date: string | null
  price_charged_cents: number | null
  outcome_notes: string | null
  created_at: string
  updated_at: string
}

export default function AppointmentsDashboard() {
  const t = useTranslations('dashboard.appointments')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState<string>('')
  const [editPreferredDate, setEditPreferredDate] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/appointments')
      return
    }
    if (!session?.user) return
    let cancelled = false
    async function load() {
      const result = await apiFetch<{ appointments: ServiceAppointment[] }>('/api/appointments')
      if (cancelled) return
      if (result.success && result.data) {
        setAppointments(result.data.appointments || [])
      } else {
        setError(result.error || t('loadError'))
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [session, status, router, t])

  const fetchAppointments = async () => {
    const result = await apiFetch<{ appointments: ServiceAppointment[] }>('/api/appointments')
    if (result.success && result.data) {
      setAppointments(result.data.appointments || [])
    } else {
      setError(result.error || t('loadError'))
    }
    setLoading(false)
  }

  const openEdit = (apt: ServiceAppointment) => {
    setEditingId(apt.id)
    setEditDescription(apt.description || '')
    setEditPreferredDate(apt.preferred_date ? new Date(apt.preferred_date).toISOString().slice(0, 16) : '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    const payload: { action: string; description: string; preferred_date?: string } = {
      action: 'update',
      description: editDescription
    }
    if (editPreferredDate) {
      const d = new Date(editPreferredDate)
      payload.preferred_date = d.toISOString()
    }
    const result = await apiFetch<void>(`/api/appointments/${editingId}`, {
      method: 'PATCH',
      body: payload
    })
    if (result.success) {
      setEditingId(null)
      fetchAppointments()
    } else {
      setError(result.error || t('saveError'))
    }
    setSaving(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case APPOINTMENT_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-info-600" />
      case APPOINTMENT_STATUS.REQUESTED:
        return <AlertCircle className="w-5 h-5 text-warning-600" />
      case APPOINTMENT_STATUS.CANCELLED:
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.REQUESTED:
        return t('statusRequested')
      case APPOINTMENT_STATUS.CONFIRMED:
        return t('statusConfirmed')
      case BOOKING_STATUS.IN_PROGRESS:
        return t('statusInProgress')
      case APPOINTMENT_STATUS.COMPLETED:
        return t('statusCompleted')
      case APPOINTMENT_STATUS.CANCELLED:
        return t('statusCancelled')
      default:
        return status
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
      case 'high':
        return 'text-error-700 bg-error-50 border border-error-200'
      case 'normal':
        return 'text-warning-700 bg-warning-50 border border-warning-200'
      case 'low':
        return 'text-success-700 bg-success-50 border border-success-200'
      default:
        return 'text-neutral-700 bg-neutral-50 border border-neutral-200'
    }
  }


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-neutral-200 rounded w-1/3 mb-4 sm:mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className="text-3xl font-bold text-neutral-900 mb-2">{t('pageTitle')}</Heading>
          <p className="text-neutral-600">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Appointments */}
        {appointments.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-info-100 rounded-lg flex-shrink-0">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-info-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Heading level={3} className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                        {appointment.service_name}
                      </Heading>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600 mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(appointment.status)}
                          <span className="ml-2">{getStatusText(appointment.status)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">{t('requestedOn')} </span>
                          <span>{formatDateTime(appointment.created_at)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(appointment.urgency)}`}>
                          {appointment.urgency === 'urgent' ? t('urgencyUrgent') : appointment.urgency === 'high' ? t('urgencyHigh') : appointment.urgency === 'normal' ? t('urgencyNormal') : t('urgencyLow')}
                        </span>
                      </div>
                      {appointment.description && (
                        <p className="text-neutral-700 mb-3 text-sm sm:text-base">{appointment.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status specific content */}
                {appointment.status === APPOINTMENT_STATUS.REQUESTED && (
                  <div className="bg-warning-50 border-2 border-warning-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-warning-800">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('requestedTitle')}</span>
                    </div>
                    <p className="text-warning-700 text-xs sm:text-sm mt-1 ml-7">
                      {t('requestedDesc')}
                    </p>
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                  <div className="bg-success-50 border-2 border-success-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-success-800">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('confirmedTitle')}</span>
                    </div>
                    <p className="text-success-700 text-xs sm:text-sm mt-1 ml-7">
                      {t('confirmedDesc')}
                    </p>
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.COMPLETED && (
                  <div className="bg-info-50 border-2 border-info-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-info-800">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('completedTitle')}</span>
                    </div>
                    {appointment.outcome_notes && (
                      <p className="text-info-700 text-xs sm:text-sm mt-1 ml-7">{appointment.outcome_notes}</p>
                    )}
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.CANCELLED && (
                  <div className="bg-error-50 border-2 border-error-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-error-800">
                      <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('cancelledTitle')}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={async () => {
                        if (!confirm(t('confirmCancel'))) return
                        const result = await apiFetch<void>(`/api/appointments/${appointment.id}`, {
                          method: 'PATCH',
                          body: { action: 'cancel' }
                        })
                        if (result.success) {
                          fetchAppointments()
                        } else {
                          setError(result.error || t('cancelFailed'))
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    >
                      {t('cancelButton')}
                    </button>
                    {appointment.status === APPOINTMENT_STATUS.REQUESTED && (
                      <button
                        onClick={() => openEdit(appointment)}
                        className="px-4 py-2 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50"
                      >
                        {t('editButton')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            iconColor="text-teal-500 dark:text-teal-400"
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Link
                href="/services"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('discoverServices')}
              </Link>
            }
          />
        )}
      </div>
      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title={t('modalTitle')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('descriptionLabel')}</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('dateLabel')}</label>
            <input
              type="datetime-local"
              value={editPreferredDate}
              onChange={(e) => setEditPreferredDate(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-neutral-300">{t('cancel')}</button>
          <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50">
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}



