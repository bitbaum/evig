/** Header card: status badge, quote approval, completion notice, pay/rate/cancel actions, rating form. */

'use client';

import { AlertCircle, CheckCircle, CreditCard, Loader2, Star, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { formatDateShort } from '@/lib/date-formats';
import {
  BOOKING_STATUS,
  type BookingStatus,
  getBookingStatusBadge,
  isPayableBookingStatus,
} from '@/config/booking-status';
import type { AppointmentDetail, BookingDetailState } from '../useBookingDetail';
import { CARD_CLASS } from './shared';

const CAN_CANCEL_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.REQUESTED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.QUOTED,
  BOOKING_STATUS.QUOTE_APPROVED,
];

interface HeaderProps {
  appointment: AppointmentDetail;
  state: BookingDetailState;
}

export function BookingHeaderCard({ appointment, state }: HeaderProps) {
  const t = useTranslations('dashboard.bookings');
  const td = useTranslations('dashboard.bookings.detail');
  const statusBadge = getBookingStatusBadge(appointment.status);
  const canRate =
    state.isCustomer &&
    appointment.status === BOOKING_STATUS.COMPLETED &&
    !appointment.customer_rating;
  const canCancel = CAN_CANCEL_STATUSES.includes(appointment.status);

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Heading level={1} className="text-xl font-bold text-text-primary mb-1">
            {appointment.service_name || t('repairLabel')}
          </Heading>
          <p className="text-xs text-text-muted">
            {td('bookingId')}
            {appointment.id.slice(0, 8).toUpperCase()} · {formatDateShort(appointment.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${statusBadge.color}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {statusBadge.description && (
        <p className="text-sm text-text-secondary mb-4">{statusBadge.description}</p>
      )}

      {state.error && <ErrorBanner message={state.error} onDismiss={state.clearError} />}

      {appointment.status === BOOKING_STATUS.QUOTED &&
        appointment.quoted_price_chf !== null &&
        state.isCustomer && <QuoteSection appointment={appointment} state={state} />}

      {appointment.status === BOOKING_STATUS.COMPLETED && (
        <CompletionNotice appointment={appointment} statusLabel={statusBadge.label} />
      )}

      <div className="flex gap-2 flex-wrap">
        {state.isCustomer &&
          isPayableBookingStatus(appointment.status) &&
          (appointment.quoted_price_chf != null ||
            appointment.status === BOOKING_STATUS.IN_PROGRESS) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => state.handlePay()}
              disabled={state.actionLoading}
            >
              {state.actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {t('payNow')}
            </Button>
          )}
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
            {state.actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {t('cancelAction')}
          </Button>
        )}
      </div>

      {state.showRating && <RatingForm state={state} />}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
      <Button onClick={onDismiss} variant="destructive-ghost" size="icon" className="ml-auto">
        ×
      </Button>
    </div>
  );
}

function QuoteSection({
  appointment,
  state,
}: {
  appointment: AppointmentDetail;
  state: BookingDetailState;
}) {
  const t = useTranslations('dashboard.bookings');
  return (
    <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
            {t('quoteLabel')}
          </p>
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
        <p className="text-sm text-warning-700 dark:text-warning-400 mb-3">
          {appointment.diagnosis_notes}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => state.handleAction('approve_quote')}
          disabled={state.actionLoading}
        >
          {state.actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
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
  );
}

function CompletionNotice({
  appointment,
  statusLabel,
}: {
  appointment: AppointmentDetail;
  statusLabel: string;
}) {
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
  );
}

function RatingForm({ state }: { state: BookingDetailState }) {
  const t = useTranslations('dashboard.bookings');
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
              <Star
                className={`w-8 h-8 ${s <= state.rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted dark:text-text-secondary'}`}
              />
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
          onClick={() =>
            state.handleAction('rate', {
              customer_rating: state.rating,
              customer_review: state.review || undefined,
            })
          }
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
  );
}
