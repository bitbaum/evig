'use client'

import { useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/date-formats'
import { getCategoryById, REQUEST_STATUS } from '@/config/it-hilfe'
import { ROUTES } from '@/config/routes'
import { TechnicianMapList } from '@/components/it-hilfe/TechnicianMapList'
import { AIDiagnosisCard } from '@/components/it-hilfe/AIDiagnosisCard'
import { ITHilfeReviewForm } from '@/components/it-hilfe/ITHilfeReviewForm'
import { MessageSidebar } from '@/components/messaging/MessageSidebar'
import {
  RequestHeader,
  OfferForm,
  OffersList,
  UserOffer,
  RequestSidebar,
  MarkCompletedCard,
  ConfirmReviewCard,
  useITHilfeDetail,
} from '@/components/it-hilfe/detail'
import { PageShell } from '@/components/layout/PageShell'

export default function ITHilfeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations('itHelp.detail')
  const detail = useITHilfeDetail(id)

  if (detail.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (detail.error || !detail.request) {
    return (
      <PageShell maxWidth="3xl" py="py-12" className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" aria-hidden="true" />
          <Heading level={1} className="text-2xl text-neutral-900 mb-2">{t('error')}</Heading>
          <p className="text-neutral-600 mb-6">{detail.error || t('requestNotFound')}</p>
          <Link
            href={ROUTES.public.itHilfe}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 min-h-[44px] rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('backToList')}
          </Link>
      </PageShell>
    )
  }

  const { request } = detail

  return (
    <PageShell maxWidth="4xl">
        {/* Back link */}
        <Link
          href={ROUTES.public.itHilfe}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 px-2 py-1 min-h-[44px] rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('backToList')}
        </Link>

        {/* Expiration Banner */}
        {detail.isExpired && (request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION) && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-warning-800 text-sm font-medium">
              {t('expiredBanner', { date: formatDate(request.expiresAt) })}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <RequestHeader request={request} />

            {/* AI Diagnosis */}
            {request.aiDiagnosis && (
              <AIDiagnosisCard
                diagnosis={request.aiDiagnosis}
                deviceInfo={[
                  getCategoryById(request.categoryId)?.name,
                  request.deviceBrand,
                  request.deviceModel,
                ].filter(Boolean).join(' - ') || undefined}
              />
            )}

            {/* Technician Map */}
            {(request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION) && (
              <div className="card-shell p-6">
                <TechnicianMapList requestId={request.id} requestTitle={request.title} />
              </div>
            )}

            {/* Helper: mark completed */}
            {detail.canMarkCompleted && (
              <MarkCompletedCard
                onMarkCompleted={detail.handleMarkCompleted}
                submitting={detail.markingCompleted}
              />
            )}

            {/* Requester: confirm + review after helper marks completed */}
            {detail.needsConfirmation && (
              <ConfirmReviewCard
                requestTitle={request.title}
                submitting={detail.confirmingReview}
                onSubmit={detail.handleConfirmReview}
              />
            )}

            {/* Completion badge (status completed, visible to everyone) */}
            {request.status === REQUEST_STATUS.COMPLETED && request.completedAt && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-primary-800 dark:text-primary-300 text-sm font-medium">
                  {t('completedAt', { date: formatDate(request.completedAt) })}
                </p>
              </div>
            )}

            {/* User's existing offer (non-owner) */}
            {detail.userOffer && !request.isOwner && (
              <UserOffer
                offer={detail.userOffer}
                withdrawing={detail.withdrawing}
                onWithdraw={detail.handleWithdrawOffer}
              />
            )}

            {/* Offer Form */}
            {detail.canOffer && !detail.userOffer && (
              <OfferForm
                showForm={detail.showOfferForm}
                onShowForm={() => detail.setShowOfferForm(true)}
                offerMessage={detail.offerMessage}
                onMessageChange={detail.setOfferMessage}
                offerEstimatedTime={detail.offerEstimatedTime}
                onEstimatedTimeChange={detail.setOfferEstimatedTime}
                offerCompensation={detail.offerCompensation}
                onCompensationChange={detail.setOfferCompensation}
                offerSkills={detail.offerSkills}
                onSkillToggle={detail.handleSkillToggle}
                submitting={detail.submittingOffer}
                error={detail.offerError}
                onSubmit={detail.handleSubmitOffer}
                onCancel={() => detail.setShowOfferForm(false)}
              />
            )}

            {/* Offers List (Owner only) */}
            {request.isOwner && (
              <OffersList
                offers={detail.offers}
                requestStatus={request.status}
                acceptingOfferId={detail.acceptingOfferId}
                decliningOfferId={detail.decliningOfferId}
                onAcceptOffer={detail.handleAcceptOffer}
                onDeclineOffer={detail.handleDeclineOffer}
              />
            )}

            {/* Review Form (completed requests) */}
            {request.status === REQUEST_STATUS.COMPLETED && detail.session?.user && !detail.hasReviewed && !detail.reviewSubmitted && (
              <ITHilfeReviewForm
                requestId={request.id}
                requestTitle={request.title}
                onSuccess={() => detail.setReviewSubmitted(true)}
              />
            )}

            {/* Review submitted confirmation */}
            {detail.reviewSubmitted && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-primary-600 mx-auto mb-2" aria-hidden="true" />
                <p className="text-primary-800 dark:text-primary-300 font-medium">{t('reviewSubmittedTitle')}</p>
                <p className="text-sm text-primary-600 mt-1">{t('reviewSubmittedMessage')}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <RequestSidebar
            request={request}
            conversationId={detail.conversationId}
            hasSession={!!detail.session?.user}
            onShowMessages={() => detail.setShowMessages(true)}
            onStatusChange={detail.handleStatusChange}
          />
        </div>

      {/* Message Sidebar */}
      <MessageSidebar
        isOpen={detail.showMessages}
        onClose={() => detail.setShowMessages(false)}
        initialConversationId={detail.conversationId}
      />

      <ConfirmDialog
        isOpen={!!detail.pendingConfirm}
        title={detail.pendingConfirmTitle}
        message={detail.pendingConfirmMessage}
        onConfirm={detail.executePendingConfirm}
        onClose={detail.cancelPendingConfirm}
      />
    </PageShell>
  )
}
