'use client'

import { useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/date-formats'
import { getCategoryById, REQUEST_STATUS } from '@/config/it-hilfe'
import { ROUTES } from '@/config/routes'
import { TechnicianMapList } from '@/components/it-hilfe/TechnicianMapList'
import { MatchedTechnicianCard } from '@/components/it-hilfe/detail/MatchedTechnicianCard'
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
  const searchParams = useSearchParams()

  // One-tap accept flow lands here with ?accepted=1 (from AcceptButton in
  // /it-hilfe/accept). The banner is computed directly from searchParams
  // so we avoid useState-in-effect (banned by react-hooks/set-state-in-effect).
  // The effect below strips the query param via history.replaceState so
  // refresh/back-nav don't replay the banner — replaceState is invisible
  // to next/navigation's useSearchParams, so the banner stays visible for
  // the lifetime of this render. The state change itself is already
  // visible (request status OPEN → MATCHED, helper info appears), but
  // the explicit confirmation closes the loop the email flow opened.
  const showAcceptedBanner = searchParams.get('accepted') === '1'
  useEffect(() => {
    if (!showAcceptedBanner) return
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.delete('accepted')
    window.history.replaceState({}, '', url.toString())
  }, [showAcceptedBanner])

  if (detail.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    )
  }

  if (detail.error || !detail.request) {
    return (
      <PageShell maxWidth="3xl" py="py-12" className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" aria-hidden="true" />
          <Heading level={1} className="text-2xl text-text-primary mb-2">{t('error')}</Heading>
          <p className="text-text-secondary mb-6">{detail.error || t('requestNotFound')}</p>
          <Button as={Link} href={ROUTES.public.itHilfe} variant="primary" size="lg">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('backToList')}
          </Button>
      </PageShell>
    )
  }

  const { request } = detail

  return (
    <PageShell maxWidth="4xl">
        {/* Back link */}
        <Link
          href={ROUTES.public.itHilfe}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 px-2 py-1 min-h-touch rounded-sm focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('backToList')}
        </Link>

        {/* Expiration Banner — covers two states:
             1. status=OPEN, expires_at < now (window before nightly cron runs)
             2. status=EXPIRED (cron has transitioned the row)
             Same message ("Anfrage ist am {date} abgelaufen") works for both;
             gating it only on status=OPEN would silently hide the banner the
             morning after the cron, leaving the requester with no explanation
             for why the action buttons disappeared. */}
        {(request.status === REQUEST_STATUS.EXPIRED ||
          (detail.isExpired && request.status === REQUEST_STATUS.OPEN)) && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 shrink-0" aria-hidden="true" />
            <p className="text-warning-800 text-sm font-medium">
              {t('expiredBanner', { date: formatDate(request.expiresAt) })}
            </p>
          </div>
        )}

        {/* Just-Accepted Banner — landed here via ?accepted=1 from email link */}
        {showAcceptedBanner && request.status === REQUEST_STATUS.MATCHED && (
          <div className="bg-action-muted border border-strong rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-action shrink-0" aria-hidden="true" />
            <p className="text-action text-sm font-medium">
              {t('acceptedBanner')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <RequestHeader request={request} />

            {/* Matched technician — phone reveal after offer acceptance (PPP.2).
                API gates matchedHelperPhone behind isOwner, so this card only
                materializes data the requester is allowed to see. */}
            {request.status === REQUEST_STATUS.MATCHED
              && request.matchedHelperId
              && request.matchedHelperName
              && request.matchedHelperPhone && (
                <MatchedTechnicianCard
                  technicianId={request.matchedHelperId}
                  technicianName={request.matchedHelperName}
                  technicianPhone={request.matchedHelperPhone}
                />
            )}

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
            {request.status === REQUEST_STATUS.OPEN && (
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
              <div className="bg-action-muted border border-strong rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-action shrink-0" aria-hidden="true" />
                <p className="text-action text-sm font-medium">
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
              <div className="bg-action-muted border border-strong rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-action mx-auto mb-2" aria-hidden="true" />
                <p className="text-action font-medium">{t('reviewSubmittedTitle')}</p>
                <p className="text-sm text-action mt-1">{t('reviewSubmittedMessage')}</p>
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
