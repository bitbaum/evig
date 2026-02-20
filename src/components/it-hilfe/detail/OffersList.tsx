import { Clock, User } from 'lucide-react'
import { getOfferStatusById, getSkillById } from '@/config/it-hilfe'
import type { Offer } from './types'

interface OffersListProps {
  offers: Offer[]
  requestStatus: string
  acceptingOfferId: string | null
  onAcceptOffer: (offerId: string) => void
}

export function OffersList({
  offers,
  requestStatus,
  acceptingOfferId,
  onAcceptOffer,
}: OffersListProps) {
  if (offers.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Eingegangene Angebote ({offers.length})
      </h3>
      <div className="space-y-4">
        {offers.map((offer) => {
          const offerStatusConfig = getOfferStatusById(offer.status)
          const isAccepted = offer.status === 'accepted'

          return (
            <div
              key={offer.id}
              className={`p-4 rounded-lg border ${
                isAccepted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{offer.helperName}</p>
                    <p className="text-sm text-gray-500">{offer.helperEmail}</p>
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

              {offer.status === 'pending' && ['open', 'in_discussion'].includes(requestStatus) && (
                <button
                  onClick={() => onAcceptOffer(offer.id)}
                  disabled={acceptingOfferId === offer.id}
                  className="mt-2 px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {acceptingOfferId === offer.id ? 'Wird akzeptiert...' : 'Angebot akzeptieren'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
