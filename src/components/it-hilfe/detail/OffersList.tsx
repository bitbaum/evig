'use client'

import { Link } from '@/i18n/navigation'
import { Clock, User, Wrench, CheckCircle, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
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
    <div className="card-shell p-6">
      <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">
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
                isAccepted ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' : 'border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${offer.repairerProfile ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-200'}`}>
                    {offer.repairerProfile ? (
                      <Wrench className="w-5 h-5 text-action" aria-hidden="true" />
                    ) : (
                      <User className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{offer.helperName}</p>
                      {offer.repairerProfile?.isVerified && (
                        <CheckCircle className="w-4 h-4 text-action" aria-label={t('verifiedTechnicianLabel')} />
                      )}
                    </div>
                    {offer.repairerProfile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Link
                          href={`/techniker/${offer.repairerProfile.id}`}
                          className="text-action hover:text-primary-700 font-medium"
                        >
                          {offer.repairerProfile.businessName || t('technicianProfileFallback')}
                        </Link>
                        {Number(offer.repairerProfile.averageRating) > 0 && (
                          <span className="flex items-center gap-0.5 text-text-tertiary">
                            <Star className="w-3 h-3 text-warning-400 fill-warning-400" aria-hidden="true" />
                            {Number(offer.repairerProfile.averageRating).toFixed(1)}
                            <span className="text-text-muted">({offer.repairerProfile.totalReviews})</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-text-tertiary">{offer.helperEmail}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
                  {offerStatusConfig?.name || offer.status}
                </span>
              </div>

              <p className="text-text-secondary mb-3">{offer.message}</p>

              {(offer.estimatedTime || offer.proposedCompensation) && (
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-3">
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
                        className="px-2 py-0.5 bg-surface-raised text-text-secondary rounded-sm text-xs"
                      >
                        {skill?.name || skillId}
                      </span>
                    )
                  })}
                </div>
              )}

              {offer.status === OFFER_STATUS.PENDING && requestStatus === REQUEST_STATUS.OPEN && (
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => onAcceptOffer(offer.id)}
                    disabled={acceptingOfferId === offer.id}
                    variant="primary"
                    size="sm"
                  >
                    {acceptingOfferId === offer.id ? t('accepting') : t('accept')}
                  </Button>
                  <Button
                    onClick={() => onDeclineOffer(offer.id)}
                    disabled={decliningOfferId === offer.id}
                    variant="outline"
                    size="sm"
                  >
                    {decliningOfferId === offer.id ? t('declining') : t('decline')}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
