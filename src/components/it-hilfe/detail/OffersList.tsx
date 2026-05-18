'use client'

import { Link } from '@/i18n/navigation'
import { Clock, User, Wrench, CheckCircle, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { getOfferStatusById, getSkillById, OFFER_STATUS, REQUEST_STATUS } from '@/config/it-hilfe'
import type { Offer } from './types'

interface OffersListProps {
  offers: Offer[]
  requestStatus: string
  acceptingOfferId: string | null
  decliningOfferId: string | null
  onAcceptOffer: (offerId: string) => void
  onDeclineOffer: (offerId: string) => void
}

export function OffersList({
  offers,
  requestStatus,
  acceptingOfferId,
  decliningOfferId,
  onAcceptOffer,
  onDeclineOffer,
}: OffersListProps) {
  const t = useTranslations('itHelp.detail')
  if (offers.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
      <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
        {t('incomingOffers', { count: offers.length })}
      </Heading>
      <div className="space-y-4">
        {offers.map((offer) => {
          const offerStatusConfig = getOfferStatusById(offer.status)
          const isAccepted = offer.status === OFFER_STATUS.ACCEPTED

          return (
            <div
              key={offer.id}
              className={`p-4 rounded-lg border ${
                isAccepted ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${offer.repairerProfile ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-200'}`}>
                    {offer.repairerProfile ? (
                      <Wrench className="w-5 h-5 text-primary-600" aria-hidden="true" />
                    ) : (
                      <User className="w-5 h-5 text-neutral-500" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900">{offer.helperName}</p>
                      {offer.repairerProfile?.isVerified && (
                        <CheckCircle className="w-4 h-4 text-primary-600" aria-label={t('verifiedTechnicianLabel')} />
                      )}
                    </div>
                    {offer.repairerProfile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Link
                          href={`/techniker/${offer.repairerProfile.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {offer.repairerProfile.businessName || t('technicianProfileFallback')}
                        </Link>
                        {Number(offer.repairerProfile.averageRating) > 0 && (
                          <span className="flex items-center gap-0.5 text-neutral-500">
                            <Star className="w-3 h-3 text-warning-400 fill-warning-400" aria-hidden="true" />
                            {Number(offer.repairerProfile.averageRating).toFixed(1)}
                            <span className="text-neutral-400">({offer.repairerProfile.totalReviews})</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">{offer.helperEmail}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-neutral-100 text-neutral-700'}`}>
                  {offerStatusConfig?.name || offer.status}
                </span>
              </div>

              <p className="text-neutral-700 mb-3">{offer.message}</p>

              {(offer.estimatedTime || offer.proposedCompensation) && (
                <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-3">
                  {offer.estimatedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {offer.estimatedTime}
                    </span>
                  )}
                  {offer.proposedCompensation && (
                    <span>{offer.proposedCompensation}</span>
                  )}
                </div>
              )}

              {offer.relevantSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {offer.relevantSkills.map((skillId) => {
                    const skill = getSkillById(skillId)
                    return (
                      <span
                        key={skillId}
                        className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs"
                      >
                        {skill?.name || skillId}
                      </span>
                    )
                  })}
                </div>
              )}

              {offer.status === OFFER_STATUS.PENDING && (requestStatus === REQUEST_STATUS.OPEN || requestStatus === REQUEST_STATUS.IN_DISCUSSION) && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onAcceptOffer(offer.id)}
                    disabled={acceptingOfferId === offer.id}
                    className="px-4 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    {acceptingOfferId === offer.id ? t('accepting') : t('accept')}
                  </button>
                  <button
                    onClick={() => onDeclineOffer(offer.id)}
                    disabled={decliningOfferId === offer.id}
                    className="px-4 py-3 min-h-[44px] border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                  >
                    {decliningOfferId === offer.id ? t('declining') : t('decline')}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
