'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Home,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort, formatDateTime } from '@/lib/date-formats'
import {
  BOOKING_STATUS,
  type BookingStatus,
  getBookingStatusBadge,
  getUrgencyBadge,
} from '@/config/booking-status'

interface AppointmentDetail {
  id: string
  user_id: string
  repairer_id: string | null
  description: string
  device_info: string | null
  preferred_date: string | null
  confirmed_date: string | null
  urgency: string
  status: BookingStatus
  outcome_notes: string | null
  estimated_duration_hours: number | null
  quoted_price_chf: number | null
  diagnosis_notes: string | null
  parts_needed: string | null
  completed_at: string | null
  completion_notes: string | null
  customer_rating: number | null
  customer_review: string | null
  is_home_visit: boolean
  visit_address: string | null
  visit_postal_code: string | null
  visit_city: string | null
  created_at: string
  updated_at: string
  customer_name: string | null
  customer_email: string | null
  repairer_name: string | null
  business_name: string | null
  repairer_phone: string | null
  service_name: string | null
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'fill-warning-400 text-warning-400' : 'text-neutral-300 dark:text-neutral-600'}`}
        />
      ))}
    </div>
  )
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations('dashboard.bookings')
  const td = useTranslations('dashboard.bookings.detail')
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const fetchAppointment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<{ appointment: AppointmentDetail }>(`/api/appointments/${id}`)
      if (result.success && result.data) {
        setAppointment(result.data.appointment)
      } else {
        setError(result.error || t('loadError'))
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (sessionStatus === 'authenticated') {
      fetchAppointment()
    }
  }, [sessionStatus, router, fetchAppointment])

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const result = await apiFetch<void>(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: { action, ...extra },
      })
      if (result.success) {
        fetchAppointment()
        setShowRating(false)
        setRating(5)
        setReview('')
      } else {
        setError(result.error || t('actionError'))
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setActionLoading(false)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
          {error || td('notFound')}
        </Heading>
        <Link
          href="/dashboard/bookings"
          className="text-action hover:text-primary-700 font-medium"
        >
          {td('backToBookings')}
        </Link>
      </div>
    )
  }

  const isCustomer = session?.user?.id === appointment.user_id
  const statusBadge = getBookingStatusBadge(appointment.status)
  const urgencyBadge = getUrgencyBadge(appointment.urgency)
  const canCancel = ([
    BOOKING_STATUS.REQUESTED,
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.QUOTED,
    BOOKING_STATUS.QUOTE_APPROVED,
  ] as BookingStatus[]).includes(appointment.status)
  const canRate = isCustomer
    && appointment.status === BOOKING_STATUS.COMPLETED
    && !appointment.customer_rating

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {td('backToBookings')}
      </Link>

      {/* Header card */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Heading level={1} className="text-xl font-bold text-text-primary mb-1">
              {appointment.service_name || t('repairLabel')}
            </Heading>
            <p className="text-xs text-text-muted">
              {td('bookingId')}{appointment.id.slice(0, 8).toUpperCase()} · {formatDateShort(appointment.created_at)}
            </p>
          </div>
          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Status description */}
        {statusBadge.description && (
          <p className="text-sm text-text-secondary mb-4">{statusBadge.description}</p>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-error-500">×</button>
          </div>
        )}

        {/* Quote section */}
        {appointment.status === BOOKING_STATUS.QUOTED && appointment.quoted_price_chf !== null && isCustomer && (
          <div className="bg-warning-50 dark:bg-warning-500/10 border-2 border-warning-200 dark:border-warning-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <p className="text-sm font-medium text-warning-800 dark:text-warning-300">{t('quoteLabel')}</p>
                <p className="text-2xl font-bold text-warning-900 dark:text-warning-200">
                  CHF {Number(appointment.quoted_price_chf).toFixed(2)}
                </p>
              </div>
              {appointment.estimated_duration_hours && (
                <div className="text-right text-sm text-warning-700 dark:text-warning-400">
                  <p>~{appointment.estimated_duration_hours}h</p>
                </div>
              )}
            </div>
            {appointment.diagnosis_notes && (
              <p className="text-sm text-warning-700 dark:text-warning-400 mb-3">{appointment.diagnosis_notes}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction('approve_quote')}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {t('acceptQuote')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('reject_quote')}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4" />
                {t('declineQuote')}
              </Button>
            </div>
          </div>
        )}

        {/* Completion section */}
        {appointment.status === BOOKING_STATUS.COMPLETED && (
          <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-primary-800 dark:text-primary-300 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">{statusBadge.label}</span>
            </div>
            {appointment.completion_notes && (
              <p className="text-sm text-primary-700 dark:text-primary-400">{appointment.completion_notes}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {canRate && !showRating && (
            <Button variant="outline" size="sm" onClick={() => setShowRating(true)}>
              <Star className="w-4 h-4" />
              {t('rateService')}
            </Button>
          )}
          {canCancel && isCustomer && (
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {t('cancelAction')}
            </Button>
          )}
        </div>

        {/* Rating form */}
        {showRating && (
          <div className="mt-4 pt-4 border-t border-subtle dark:border-white/6 space-y-4">
            <Heading level={3} className="text-sm font-semibold text-text-primary">
              {t('ratingModalTitle')}
            </Heading>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('ratingLabel')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star className={`w-8 h-8 ${s <= rating ? 'fill-warning-400 text-warning-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                  </button>
                ))}
              </div>
            </div>
            <FormField label={t('commentLabel')}>
              <Textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder={t('commentPlaceholder')}
                rows={3}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction('rate', { customer_rating: rating, customer_review: review || undefined })}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('submitRating')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowRating(false)}>
                {t('cancelButton')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Service details */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6 space-y-4">
        <Heading level={2} className="text-sm font-semibold text-text-tertiary uppercase tracking-widest">
          {td('sectionService')}
        </Heading>

        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary">{td('service')}</p>
            <p className="text-text-primary">{appointment.service_name || t('repairLabel')}</p>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${urgencyBadge.color}`}>
            {urgencyBadge.label}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary mb-0.5">{td('problem')}</p>
            <p className="text-text-primary text-sm leading-relaxed">{appointment.description}</p>
          </div>
        </div>

        {appointment.device_info && (
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 shrink-0 mt-0.5 text-center text-text-muted text-xs font-bold">💻</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-0.5">{td('deviceInfo')}</p>
              <p className="text-text-primary text-sm">{appointment.device_info}</p>
            </div>
          </div>
        )}

        {appointment.parts_needed && (
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 shrink-0 mt-0.5 text-text-muted text-xs">🔩</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-0.5">{td('partsNeeded')}</p>
              <p className="text-text-primary text-sm">{appointment.parts_needed}</p>
            </div>
          </div>
        )}

        {appointment.outcome_notes && (
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-secondary mb-0.5">{td('outcomeNotes')}</p>
              <p className="text-text-primary text-sm">{appointment.outcome_notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Technician */}
      {(appointment.repairer_name || appointment.business_name) && (
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6 space-y-4">
          <Heading level={2} className="text-sm font-semibold text-text-tertiary uppercase tracking-widest">
            {td('sectionTechnician')}
          </Heading>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-raised dark:bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-text-tertiary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {appointment.business_name || appointment.repairer_name}
              </p>
              {appointment.business_name && appointment.repairer_name && (
                <p className="text-sm text-text-tertiary">{appointment.repairer_name}</p>
              )}
            </div>
          </div>
          {appointment.repairer_phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-text-muted shrink-0" />
              <a
                href={`tel:${appointment.repairer_phone}`}
                className="text-action hover:underline text-sm"
              >
                {appointment.repairer_phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6 space-y-3">
        <Heading level={2} className="text-sm font-semibold text-text-tertiary uppercase tracking-widest mb-4">
          {td('sectionDates')}
        </Heading>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-text-tertiary w-36 shrink-0">{td('requestedOn')}</span>
          <span className="text-text-primary">{formatDateTime(appointment.created_at)}</span>
        </div>
        {appointment.preferred_date && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-text-muted shrink-0" />
            <span className="text-text-tertiary w-36 shrink-0">{td('preferredDate')}</span>
            <span className="text-text-primary">{formatDateTime(appointment.preferred_date)}</span>
          </div>
        )}
        {appointment.confirmed_date && (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
            <span className="text-text-tertiary w-36 shrink-0">{td('confirmedDate')}</span>
            <span className="text-text-primary">{formatDateTime(appointment.confirmed_date)}</span>
          </div>
        )}
        {appointment.completed_at && (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
            <span className="text-text-tertiary w-36 shrink-0">{td('completedAt')}</span>
            <span className="text-text-primary">{formatDateShort(appointment.completed_at)}</span>
          </div>
        )}
      </div>

      {/* Location (home visit) */}
      {appointment.is_home_visit && appointment.visit_address && (
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
          <Heading level={2} className="text-sm font-semibold text-text-tertiary uppercase tracking-widest mb-4">
            {td('sectionLocation')}
          </Heading>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-tertiary">{t('homeVisit')}</span>
              </div>
              <p className="text-text-primary text-sm">{appointment.visit_address}</p>
              {(appointment.visit_postal_code || appointment.visit_city) && (
                <p className="text-text-secondary text-sm">
                  {[appointment.visit_postal_code, appointment.visit_city].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating (if already rated) */}
      {appointment.customer_rating && (
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
          <Heading level={2} className="text-sm font-semibold text-text-tertiary uppercase tracking-widest mb-4">
            {td('yourRating')}
          </Heading>
          <StarDisplay rating={appointment.customer_rating} />
          {appointment.customer_review && (
            <p className="text-text-secondary text-sm mt-2">{appointment.customer_review}</p>
          )}
        </div>
      )}
    </div>
  )
}
