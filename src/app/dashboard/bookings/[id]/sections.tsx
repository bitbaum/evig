/**
 * Presentation cards for the /dashboard/bookings/[id] page.
 *
 * Pure JSX + props. Each card maps one "slot" of the booking detail
 * page; page.tsx composes them. State + actions live in
 * useBookingDetail.
 */

'use client'

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Loader2,
  MapPin,
  Phone,
  Star,
  User,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { formatDateShort, formatDateTime } from '@/lib/date-formats'
import {
  BOOKING_STATUS,
  type BookingStatus,
  getBookingStatusBadge,
  getUrgencyBadge,
} from '@/config/booking-status'
import type { AppointmentDetail, BookingDetailState } from './useBookingDetail'

const CAN_CANCEL_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.REQUESTED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.QUOTED,
  BOOKING_STATUS.QUOTE_APPROVED,
]

const CARD_CLASS = 'bg-surface-base rounded-xl border border-subtle p-6'
const SECTION_TITLE_CLASS = 'text-sm font-semibold text-text-tertiary uppercase tracking-widest'

/* ─────────────────────────── Star display ─────────────────────────── */

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted dark:text-text-secondary'}`}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────── Header card ─────────────────────────── */

interface HeaderProps {
  appointment: AppointmentDetail
  state: BookingDetailState
}

export function BookingHeaderCard({ appointment, state }: HeaderProps) {
  const t = useTranslations('dashboard.bookings')
  const td = useTranslations('dashboard.bookings.detail')
  const statusBadge = getBookingStatusBadge(appointment.status)
  const canRate = state.isCustomer
    && appointment.status === BOOKING_STATUS.COMPLETED
    && !appointment.customer_rating
  const canCancel = CAN_CANCEL_STATUSES.includes(appointment.status)

  return (
    <div className={CARD_CLASS}>
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

      {statusBadge.description && (
        <p className="text-sm text-text-secondary mb-4">{statusBadge.description}</p>
      )}

      {state.error && <ErrorBanner message={state.error} onDismiss={state.clearError} />}

      {appointment.status === BOOKING_STATUS.QUOTED
        && appointment.quoted_price_chf !== null
        && state.isCustomer && (
          <QuoteSection appointment={appointment} state={state} />
      )}

      {appointment.status === BOOKING_STATUS.COMPLETED && (
        <CompletionNotice appointment={appointment} statusLabel={statusBadge.label} />
      )}

      <div className="flex gap-2 flex-wrap">
        {canRate && !state.showRating && (
          <Button variant="outline" size="sm" onClick={() => state.setShowRating(true)}>
            <Star className="w-4 h-4" />
            {t('rateService')}
          </Button>
        )}
        {canCancel && state.isCustomer && (
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={() => state.handleAction('cancel')}
            disabled={state.actionLoading}
          >
            {state.actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {t('cancelAction')}
          </Button>
        )}
      </div>

      {state.showRating && <RatingForm state={state} />}
    </div>
  )
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
      <Button onClick={onDismiss} variant="destructive-ghost" size="icon" className="ml-auto">×</Button>
    </div>
  )
}

function QuoteSection({ appointment, state }: { appointment: AppointmentDetail; state: BookingDetailState }) {
  const t = useTranslations('dashboard.bookings')
  return (
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
          onClick={() => state.handleAction('approve_quote')}
          disabled={state.actionLoading}
        >
          {state.actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {t('acceptQuote')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => state.handleAction('reject_quote')}
          disabled={state.actionLoading}
        >
          <XCircle className="w-4 h-4" />
          {t('declineQuote')}
        </Button>
      </div>
    </div>
  )
}

function CompletionNotice({ appointment, statusLabel }: { appointment: AppointmentDetail; statusLabel: string }) {
  return (
    <div className="bg-action-muted/10 border border-strong dark:border-action/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 text-action mb-1">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{statusLabel}</span>
      </div>
      {appointment.completion_notes && (
        <p className="text-sm text-action">{appointment.completion_notes}</p>
      )}
    </div>
  )
}

function RatingForm({ state }: { state: BookingDetailState }) {
  const t = useTranslations('dashboard.bookings')
  return (
    <div className="mt-4 pt-4 border-t border-subtle space-y-4">
      <Heading level={3} className="text-sm font-semibold text-text-primary">
        {t('ratingModalTitle')}
      </Heading>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {t('ratingLabel')}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Button key={s} onClick={() => state.setRating(s)} variant="ghost" size="icon">
              <Star className={`w-8 h-8 ${s <= state.rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted dark:text-text-secondary'}`} />
            </Button>
          ))}
        </div>
      </div>
      <FormField label={t('commentLabel')}>
        <Textarea
          value={state.review}
          onChange={(e) => state.setReview(e.target.value)}
          placeholder={t('commentPlaceholder')}
          rows={3}
        />
      </FormField>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => state.handleAction('rate', { customer_rating: state.rating, customer_review: state.review || undefined })}
          disabled={state.actionLoading}
        >
          {state.actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('submitRating')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => state.setShowRating(false)}>
          {t('cancelButton')}
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Service details ─────────────────────────── */

export function ServiceDetailsCard({ appointment }: { appointment: AppointmentDetail }) {
  const t = useTranslations('dashboard.bookings')
  const td = useTranslations('dashboard.bookings.detail')
  const urgencyBadge = getUrgencyBadge(appointment.urgency)
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {td('sectionService')}
      </Heading>

      <DetailRow icon={<Wrench className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />} label={td('service')} value={appointment.service_name || t('repairLabel')}>
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${urgencyBadge.color}`}>
          {urgencyBadge.label}
        </span>
      </DetailRow>

      <DetailRow icon={<AlertCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />} label={td('problem')} value={appointment.description} valueClass="text-sm leading-relaxed" />

      {appointment.device_info && (
        <DetailRow icon={<EmojiIcon char="💻" />} label={td('deviceInfo')} value={appointment.device_info} />
      )}
      {appointment.parts_needed && (
        <DetailRow icon={<EmojiIcon char="🔩" />} label={td('partsNeeded')} value={appointment.parts_needed} />
      )}
      {appointment.outcome_notes && (
        <DetailRow icon={<CheckCircle className="w-5 h-5 text-action shrink-0 mt-0.5" />} label={td('outcomeNotes')} value={appointment.outcome_notes} />
      )}
    </div>
  )
}

function DetailRow({
  icon, label, value, valueClass = '', children,
}: { icon: React.ReactNode; label: string; value: string; valueClass?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-secondary mb-0.5">{label}</p>
        <p className={`text-text-primary text-sm ${valueClass}`}>{value}</p>
      </div>
      {children}
    </div>
  )
}

function EmojiIcon({ char }: { char: string }) {
  return <div className="w-5 h-5 shrink-0 mt-0.5 text-center text-text-muted text-xs">{char}</div>
}

/* ─────────────────────────── Technician ─────────────────────────── */

export function TechnicianCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail')
  if (!appointment.repairer_name && !appointment.business_name) return null
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {td('sectionTechnician')}
      </Heading>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center shrink-0">
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
          <a href={`tel:${appointment.repairer_phone}`} className="text-action hover:underline text-sm">
            {appointment.repairer_phone}
          </a>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Dates ─────────────────────────── */

export function DatesCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail')
  return (
    <div className={`${CARD_CLASS} space-y-3`}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
        {td('sectionDates')}
      </Heading>
      <DateRow icon={<Clock className="w-4 h-4 text-text-muted shrink-0" />} label={td('requestedOn')} value={formatDateTime(appointment.created_at)} />
      {appointment.preferred_date && (
        <DateRow icon={<Calendar className="w-4 h-4 text-text-muted shrink-0" />} label={td('preferredDate')} value={formatDateTime(appointment.preferred_date)} />
      )}
      {appointment.confirmed_date && (
        <DateRow icon={<CheckCircle className="w-4 h-4 text-action shrink-0" />} label={td('confirmedDate')} value={formatDateTime(appointment.confirmed_date)} />
      )}
      {appointment.completed_at && (
        <DateRow icon={<CheckCircle className="w-4 h-4 text-action shrink-0" />} label={td('completedAt')} value={formatDateShort(appointment.completed_at)} />
      )}
    </div>
  )
}

function DateRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span className="text-text-tertiary w-36 shrink-0">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}

/* ─────────────────────────── Location ─────────────────────────── */

export function LocationCard({ appointment }: { appointment: AppointmentDetail }) {
  const t = useTranslations('dashboard.bookings')
  const td = useTranslations('dashboard.bookings.detail')
  if (!appointment.is_home_visit || !appointment.visit_address) return null
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
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
  )
}

/* ─────────────────────────── Rating display ─────────────────────────── */

export function RatingCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail')
  if (!appointment.customer_rating) return null
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
        {td('yourRating')}
      </Heading>
      <StarDisplay rating={appointment.customer_rating} />
      {appointment.customer_review && (
        <p className="text-text-secondary text-sm mt-2">{appointment.customer_review}</p>
      )}
    </div>
  )
}
