'use client'

import { Calendar, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import Link from 'next/link'
import { formatDate } from '@/lib/date-formats'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/EmptyState'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { useWorkshopRegistrations } from '@/hooks/useWorkshopRegistrations'
import type { WorkshopRegistration } from '@/hooks/useWorkshopRegistrations'
import { ROUTES } from '@/config/routes'

function getStatusIcon(status: string) {
  switch (status) {
    case WORKSHOP_REGISTRATION_STATUS.CONFIRMED:
      return <CheckCircle className="w-5 h-5 text-success-500" />
    case WORKSHOP_REGISTRATION_STATUS.PENDING:
      return <AlertCircle className="w-5 h-5 text-warning-500" />
    case WORKSHOP_REGISTRATION_STATUS.CANCELLED:
      return <XCircle className="w-5 h-5 text-error-500" />
    default:
      return <AlertCircle className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
  }
}

export default function WorkshopsDashboard() {
  const t = useTranslations('dashboard.workshops')
  const tDates = useTranslations('dashboard.dates')

  const {
    session,
    sessionStatus,
    registrations,
    loading,
    error,
    editingId,
    editRating,
    editFeedback,
    saving,
    pendingCancelId,
    setEditingId,
    setEditRating,
    setEditFeedback,
    setPendingCancelId,
    openEdit,
    saveEdit,
    doCancel,
  } = useWorkshopRegistrations({
    loadError: t('loadError'),
    saveFailed: t('saveFailed'),
    cancelFailed: t('cancelFailed'),
  })

  function getStatusText(status: string) {
    switch (status) {
      case WORKSHOP_REGISTRATION_STATUS.CONFIRMED: return t('statusConfirmed')
      case WORKSHOP_REGISTRATION_STATUS.PENDING: return t('statusPending')
      case WORKSHOP_REGISTRATION_STATUS.CANCELLED: return t('statusCancelled')
      default: return status
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 border-2 border-neutral-200 dark:border-white/[0.06]">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 text-center border-2 border-neutral-200 dark:border-white/[0.06]">
            <Heading level={1} className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">{t('loginRequired')}</Heading>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">{t('loginDesc')}</p>
            <Button as={Link} href={ROUTES.public.login} variant="primary">
              {t('login')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center mb-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">{t('pageTitle')}</Heading>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">{t('pageSubtitle')}</p>
        </div>

        {error && (
          <div className="rounded-lg p-4 mb-6 border-2 bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/30">
            <p className="text-sm text-error-800 dark:text-error-400">{error}</p>
          </div>
        )}

        {registrations.length > 0 ? (
          <div className="space-y-6">
            {registrations.map((registration: WorkshopRegistration) => (
              <div key={registration.id} className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg dark:shadow-black/30 p-4 sm:p-6 border-2 border-neutral-200 dark:border-white/[0.06]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Heading level={3} className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
                      {registration.workshop_title}
                    </Heading>
                    <div className="flex items-center gap-4 text-sm mb-3 text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center">
                        {getStatusIcon(registration.status)}
                        <span className="ml-2">{getStatusText(registration.status)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{tDates('registeredOn', { date: formatDate(registration.created_at) })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {registration.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED && (
                  <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30 rounded-lg p-4">
                    <div className="flex items-center text-primary-800 dark:text-primary-300">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">{t('confirmedTitle')}</span>
                    </div>
                    <p className="text-primary-700 dark:text-primary-400 text-sm mt-1">{t('confirmedDesc')}</p>
                  </div>
                )}

                {registration.status === WORKSHOP_REGISTRATION_STATUS.PENDING && (
                  <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-lg p-4">
                    <div className="flex items-center text-warning-800 dark:text-warning-300">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">{t('pendingTitle')}</span>
                    </div>
                    <p className="text-warning-700 dark:text-warning-400 text-sm mt-1">{t('pendingDesc')}</p>
                  </div>
                )}

                {registration.status === WORKSHOP_REGISTRATION_STATUS.CANCELLED && (
                  <div className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg p-4">
                    <div className="flex items-center text-error-800 dark:text-error-300">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">{t('cancelledTitle')}</span>
                    </div>
                    {registration.cancelled_at && (
                      <p className="text-error-700 dark:text-error-400 text-sm mt-1">
                        {t('cancelledOn', { date: formatDate(registration.cancelled_at) })}
                      </p>
                    )}
                  </div>
                )}

                {registration.status !== WORKSHOP_REGISTRATION_STATUS.CANCELLED && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingCancelId(registration.id)}
                    >
                      {t('cancelButton')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(registration)}
                    >
                      {registration.feedback || registration.rating ? t('feedbackEdit') : t('feedbackAdd')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            iconBg="bg-primary-50 dark:bg-primary-900/20"
            iconColor="text-primary-500 dark:text-primary-400"
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Button as={Link} href="/workshops" variant="primary">
                {t('discoverWorkshops')}
              </Button>
            }
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingCancelId}
        title={t('cancelButton')}
        message={t('confirmCancel')}
        itemName={registrations.find(r => r.id === pendingCancelId)?.workshop_title}
        onConfirm={doCancel}
        onClose={() => setPendingCancelId(null)}
      />

      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title={t('modalTitle')}>
        <div className="space-y-4">
          <FormField label={t('ratingLabel')}>
            <Input
              type="number"
              min={1}
              max={5}
              value={editRating}
              onChange={(e) => setEditRating(Math.max(1, Math.min(5, Number(e.target.value))))}
              className="w-24"
            />
          </FormField>
          <FormField label={t('feedbackLabel')}>
            <Textarea
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
              rows={4}
              placeholder={t('feedbackPlaceholder')}
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
    </div>
  )
}
