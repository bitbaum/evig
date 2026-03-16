'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/date-formats'
import { getCategoryById, REQUEST_STATUS } from '@/config/it-hilfe'
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
  useITHilfeDetail,
} from '@/components/it-hilfe/detail'

export default function ITHilfeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const detail = useITHilfeDetail(id)

  if (detail.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (detail.error || !detail.request) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fehler</h1>
          <p className="text-gray-600 mb-6">{detail.error || 'Anfrage nicht gefunden'}</p>
          <Link
            href="/it-hilfe"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 min-h-[44px] rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  const { request } = detail

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/it-hilfe"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-2 py-1 min-h-[44px] rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Zurück zur Übersicht
        </Link>

        {/* Expiration Banner */}
        {detail.isExpired && (request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-amber-800 text-sm font-medium">
              Diese Anfrage ist am {formatDate(request.expiresAt)} abgelaufen und akzeptiert keine neuen Angebote mehr.
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <TechnicianMapList requestId={request.id} requestTitle={request.title} />
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
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" aria-hidden="true" />
                <p className="text-emerald-800 font-medium">Bewertung abgegeben!</p>
                <p className="text-sm text-emerald-600 mt-1">Vielen Dank für dein Feedback.</p>
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
      </div>

      {/* Message Sidebar */}
      <MessageSidebar
        isOpen={detail.showMessages}
        onClose={() => detail.setShowMessages(false)}
        initialConversationId={detail.conversationId}
      />
    </div>
  )
}
