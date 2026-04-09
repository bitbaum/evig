import Link from 'next/link'
import { Clock, User, Wrench, CheckCircle, Star } from 'lucide-react'
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
  if (offers.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
        Eingegangene Angebote ({offers.length})
      </Heading>
      <div className="space-y-4">
        {offers.map((offer) => {
          const offerStatusConfig = getOfferStatusById(offer.status)
          const isAccepted = offer.status === OFFER_STATUS.ACCEPTED

          return (
            <div
              key={offer.id}
              className={`p-4 rounded-lg border ${
                isAccepted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${offer.repairerProfile ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    {offer.repairerProfile ? (
                      <Wrench className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{offer.helperName}</p>
                      {offer.repairerProfile?.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600" aria-label="Verifizierter Techniker" />
                      )}
                    </div>
                    {offer.repairerProfile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Link
                          href={`/techniker/${offer.repairerProfile.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {offer.repairerProfile.businessName || 'Techniker-Profil'}
                        </Link>
                        {Number(offer.repairerProfile.averageRating) > 0 && (
                          <span className="flex items-center gap-0.5 text-gray-500">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                            {Number(offer.repairerProfile.averageRating).toFixed(1)}
                            <span className="text-gray-400">({offer.repairerProfile.totalReviews})</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{offer.helperEmail}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                  {offerStatusConfig?.name || offer.status}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{offer.message}</p>

              {(offer.estimatedTime || offer.proposedCompensation) && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
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
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
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
                    className="px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    {acceptingOfferId === offer.id ? 'Wird akzeptiert...' : 'Akzeptieren'}
                  </button>
                  <button
                    onClick={() => onDeclineOffer(offer.id)}
                    disabled={decliningOfferId === offer.id}
                    className="px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  >
                    {decliningOfferId === offer.id ? 'Wird abgelehnt...' : 'Ablehnen'}
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
