'use client'

import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, AlertCircle, Wrench,
  Calendar, Star, Euro,
  ChevronRight, Loader2, RefreshCw, Home
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { BOOKING_STATUS, BOOKING_STATUS_BADGES, type BookingStatus } from '@/config/booking-status'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'
import { useCustomerBookings } from '@/hooks/useCustomerBookings'
import { ROUTES } from '@/config/routes'

const STATUS_CONFIG = BOOKING_STATUS_BADGES

export default function CustomerBookings() {
  const t = useTranslations('dashboard.bookings')

  const {
    filteredAppointments, activeCount, needsAction,
    loading, error, activeTab, actionLoading, ratingModal, rating, review,
    sessionStatus,
    setError, setActiveTab, setRatingModal, setRating, setReview,
    fetchAppointments, handleAction,
  } = useCustomerBookings({
    loadError: t('loadError'),
    actionError: t('actionError'),
    networkError: t('networkError'),
  })

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-action" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-raised py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">{t('pageTitle')}</Heading>
            <p className="text-text-secondary">{t('pageSubtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchAppointments}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </Button>
            <Button as={Link} href={ROUTES.public.techniker} variant="primary" size="sm">
              <Wrench className="h-4 w-4" />
              {t('newOrder')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg flex items-center gap-2 text-error-700 dark:text-error-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
            <Button onClick={() => setError(null)} variant="destructive-ghost" size="icon" className="ml-auto">×</Button>
          </div>
        )}

        {needsAction > 0 && (
          <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-lg flex items-center gap-2 text-warning-800 dark:text-warning-300">
            <Euro className="h-5 w-5 shrink-0" />
            {t('pendingQuotes', { count: needsAction })}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('active')}
            variant="ghost"
            className={activeTab === 'active'
              ? 'bg-action-muted text-action'
              : 'bg-surface-base text-text-secondary hover:bg-surface-raised'}
          >
            <Clock className="h-4 w-4" />
            {t('tabActive')}
            {activeCount > 0 && (
              <span className="bg-action text-white text-xs px-2 py-0.5 rounded-full">{activeCount}</span>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab('completed')}
            variant="ghost"
            className={activeTab === 'completed'
              ? 'bg-action-muted text-action'
              : 'bg-surface-base text-text-secondary hover:bg-surface-raised'}
          >
            <CheckCircle className="h-4 w-4" />
            {t('tabCompleted')}
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={Wrench}
              iconBg="bg-action-muted"
              iconColor="text-action"
              title={t('emptyTitle')}
              action={
                <Button as={Link} href={ROUTES.public.techniker} variant="primary">
                  {t('findTechnician')}
                </Button>
              }
            />
          ) : (
            filteredAppointments.map(apt => (
              <div key={apt.id} className="bg-surface-base rounded-lg shadow-xs border border p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                  <div>
                    <span className={'px-3 py-1 rounded-full text-sm font-medium ' +
                      (STATUS_CONFIG[apt.status]?.color || 'bg-surface-raised')}>
                      {STATUS_CONFIG[apt.status]?.label || apt.status}
                    </span>
                    <p className="text-xs text-text-tertiary mt-1">{STATUS_CONFIG[apt.status]?.description}</p>
                  </div>
                  <div className="text-right text-sm text-text-tertiary">
                    {formatDateShort(apt.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div>
                    <Heading level={3} className="font-semibold text-text-primary">{apt.business_name || apt.repairer_name}</Heading>
                    <p className="text-sm text-text-tertiary">{apt.service_name || t('repairLabel')}</p>
                  </div>
                </div>

                <p className="text-text-secondary mb-4">{apt.description}</p>

                {apt.quoted_price_chf && (
                  <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-lg p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-warning-800 dark:text-warning-300 font-medium">{t('quoteLabel')}</p>
                        <p className="text-2xl font-bold text-warning-900 dark:text-warning-200">CHF {apt.quoted_price_chf}</p>
                      </div>
                      {apt.diagnosis_notes && (
                        <p className="text-sm text-warning-700 dark:text-warning-400 sm:max-w-xs">{apt.diagnosis_notes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
                  {apt.preferred_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateShort(apt.preferred_date)}
                    </div>
                  )}
                  {apt.is_home_visit && (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      {t('homeVisit')}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-subtle dark:border-white/6">
                  {apt.status === BOOKING_STATUS.QUOTED && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(apt.id, 'approve_quote')}
                        disabled={actionLoading === apt.id}
                      >
                        {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        {t('acceptQuote')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(apt.id, 'reject_quote')}
                        disabled={actionLoading === apt.id}
                      >
                        <XCircle className="h-4 w-4" />
                        {t('declineQuote')}
                      </Button>
                    </>
                  )}

                  {apt.status === BOOKING_STATUS.COMPLETED && !apt.customer_rating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRatingModal({ appointmentId: apt.id, open: true })}
                    >
                      <Star className="h-4 w-4" />
                      {t('rateService')}
                    </Button>
                  )}

                  {([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED] as BookingStatus[]).includes(apt.status) && (
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => handleAction(apt.id, 'cancel')}
                      disabled={actionLoading === apt.id}
                    >
                      {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      {t('cancelAction')}
                    </Button>
                  )}

                  <Link
                    href={'/dashboard/bookings/' + apt.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-raised text-text-secondary rounded-md hover:bg-surface-overlay text-sm font-medium sm:ml-auto transition-colors"
                  >
                    {t('details')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <Modal isOpen={!!ratingModal?.open} onClose={() => setRatingModal(null)} title={t('ratingModalTitle')} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">{t('ratingLabel')}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Button
                    key={star}
                    onClick={() => setRating(star)}
                    variant="ghost"
                    size="icon"
                  >
                    <Star
                      className={'h-8 w-8 ' + (star <= rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted dark:text-text-secondary')}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <FormField label={t('commentLabel')}>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t('commentPlaceholder')}
                rows={3}
              />
            </FormField>
          </div>
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setRatingModal(null)}
              className="flex-1"
            >
              {t('cancelButton')}
            </Button>
            <Button
              variant="primary"
              onClick={() => ratingModal && handleAction(ratingModal.appointmentId, 'rate', {
                customer_rating: rating,
                customer_review: review || undefined
              })}
              disabled={actionLoading !== null}
              className="flex-1"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submitRating')}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
