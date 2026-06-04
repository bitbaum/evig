'use client'

import { Calendar, Clock, Wrench, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDateTime } from '@/lib/date-formats'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { BOOKING_STATUS } from '@/config/booking-status'
import { URGENCY } from '@/config/it-hilfe'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { useAppointments, type ServiceAppointment } from '@/hooks/useAppointments'

function getStatusIcon(status: string) {
  switch (status) {
    case APPOINTMENT_STATUS.CONFIRMED: return <CheckCircle className="w-5 h-5 text-success-600" />
    case APPOINTMENT_STATUS.COMPLETED: return <CheckCircle className="w-5 h-5 text-action" />
    case APPOINTMENT_STATUS.REQUESTED: return <AlertCircle className="w-5 h-5 text-warning-600" />
    case APPOINTMENT_STATUS.CANCELLED: return <XCircle className="w-5 h-5 text-error-600" />
    default: return <AlertCircle className="w-5 h-5 text-text-tertiary" />
  }
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case URGENCY.URGENT:
    case URGENCY.HIGH: return 'text-error-700 dark:text-error-400 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30'
    case URGENCY.NORMAL: return 'text-warning-700 dark:text-warning-400 bg-warning-50 border border-warning-200'
    case URGENCY.LOW: return 'text-success-700 bg-success-50 border border-success-200'
    default: return 'text-text-secondary bg-surface-raised border border'
  }
}

export default function AppointmentsDashboard() {
  const t = useTranslations('dashboard.appointments')

  const {
    appointments, loading, error, paymentSuccess,
    editingId, pendingCancelId, editDescription, editPreferredDate, saving,
    sessionStatus,
    setPaymentSuccess, setEditingId, setPendingCancelId,
    setEditDescription, setEditPreferredDate,
    doCancel, openEdit, saveEdit,
    isRepairerView,
  } = useAppointments({
    loadError: t('loadError'),
    cancelFailed: t('cancelFailed'),
    saveError: t('saveError'),
  })

  function getStatusText(status: string) {
    switch (status) {
      case APPOINTMENT_STATUS.REQUESTED: return t('statusRequested')
      case APPOINTMENT_STATUS.CONFIRMED: return t('statusConfirmed')
      case BOOKING_STATUS.IN_PROGRESS: return t('statusInProgress')
      case APPOINTMENT_STATUS.COMPLETED: return t('statusCompleted')
      case APPOINTMENT_STATUS.CANCELLED: return t('statusCancelled')
      default: return status
    }
  }

  function getUrgencyLabel(urgency: string) {
    switch (urgency) {
      case URGENCY.URGENT: return t('urgencyUrgent')
      case URGENCY.HIGH: return t('urgencyHigh')
      case URGENCY.NORMAL: return t('urgencyNormal')
      default: return t('urgencyLow')
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-surface-raised dark:bg-neutral-950 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-surface-base rounded-xl shadow-lg p-4 sm:p-8">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/3 mb-4 sm:mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-full"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-raised dark:bg-neutral-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className="text-3xl font-bold text-text-primary mb-2">{t('pageTitle')}</Heading>
          <p className="text-text-secondary">
            {isRepairerView ? t('pageSubtitleRepairer') : t('pageSubtitle')}
          </p>
        </div>

        {paymentSuccess && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-lg p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-action shrink-0" />
              <p className="text-primary-800 dark:text-primary-300 font-medium">{t('paymentSuccess')}</p>
            </div>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="text-action hover:text-primary-800 text-lg leading-none"
              aria-label="Schliessen"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 mb-6">
            <p className="text-error-800 dark:text-error-400">{error}</p>
          </div>
        )}

        {appointments.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {appointments.map((appointment: ServiceAppointment) => (
              <div key={appointment.id} className="bg-surface-base rounded-xl shadow-lg dark:shadow-black/30 p-4 sm:p-6 border border-transparent dark:border-white/6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-surface-raised dark:bg-neutral-800 rounded-lg shrink-0">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Heading level={3} className="text-lg sm:text-xl font-semibold text-text-primary mb-2">
                        {appointment.service_name}
                      </Heading>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-secondary mb-3">
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
                          {getUrgencyLabel(appointment.urgency)}
                        </span>
                      </div>
                      {appointment.description && (
                        <p className="text-text-secondary mb-3 text-sm sm:text-base">{appointment.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {appointment.status === APPOINTMENT_STATUS.REQUESTED && (
                  <div className="bg-warning-50 dark:bg-warning-500/10 border-2 border-warning-200 dark:border-warning-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-warning-800 dark:text-warning-300">
                      <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('requestedTitle')}</span>
                    </div>
                    <p className="text-warning-700 dark:text-warning-400 text-xs sm:text-sm mt-1 ml-7">{t('requestedDesc')}</p>
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                  <div className="bg-success-50 dark:bg-success-500/10 border-2 border-success-200 dark:border-success-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-success-800 dark:text-success-300">
                      <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('confirmedTitle')}</span>
                    </div>
                    <p className="text-success-700 dark:text-success-400 text-xs sm:text-sm mt-1 ml-7">{t('confirmedDesc')}</p>
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.COMPLETED && (
                  <div className="bg-primary-50 dark:bg-primary-500/10 border-2 border-primary-200 dark:border-primary-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-primary-800 dark:text-primary-300">
                      <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('completedTitle')}</span>
                    </div>
                    {appointment.outcome_notes && (
                      <p className="text-primary-700 dark:text-primary-400 text-xs sm:text-sm mt-1 ml-7">{appointment.outcome_notes}</p>
                    )}
                  </div>
                )}

                {appointment.status === APPOINTMENT_STATUS.CANCELLED && (
                  <div className="bg-error-50 dark:bg-error-500/10 border-2 border-error-200 dark:border-error-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-error-800 dark:text-error-300">
                      <XCircle className="w-5 h-5 mr-2 shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{t('cancelledTitle')}</span>
                    </div>
                  </div>
                )}

                {appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingCancelId(appointment.id)}
                    >
                      {t('cancelButton')}
                    </Button>
                    {appointment.status === APPOINTMENT_STATUS.REQUESTED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(appointment)}
                      >
                        {t('editButton')}
                      </Button>
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
            description={isRepairerView ? t('emptyDescRepairer') : t('emptyDesc')}
            action={
              isRepairerView ? undefined : (
                <Button as={Link} href="/services" variant="primary">
                  {t('discoverServices')}
                </Button>
              )
            }
          />
        )}
      </div>

      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title={t('modalTitle')}>
        <div className="space-y-4">
          <FormField label={t('descriptionLabel')}>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              placeholder={t('descriptionPlaceholder')}
            />
          </FormField>
          <FormField label={t('dateLabel')}>
            <Input
              type="datetime-local"
              value={editPreferredDate}
              onChange={(e) => setEditPreferredDate(e.target.value)}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditingId(null)}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={saveEdit} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!pendingCancelId}
        title={t('cancelButton')}
        message={t('confirmCancel')}
        itemName={appointments.find((a: ServiceAppointment) => a.id === pendingCancelId)?.service_name}
        onConfirm={doCancel}
        onClose={() => setPendingCancelId(null)}
      />
    </div>
  )
}
