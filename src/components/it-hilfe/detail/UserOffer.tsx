import { Clock } from 'lucide-react'
import type { Offer } from './types'

interface UserOfferProps {
  offer: Offer
  withdrawing: boolean
  onWithdraw: () => void
}

export function UserOffer({ offer, withdrawing, onWithdraw }: UserOfferProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Dein Angebot</h3>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          Ausstehend
        </span>
      </div>
      <p className="text-gray-700 mb-3">{offer.message}</p>
      {(offer.estimatedTime || offer.proposedCompensation) && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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
      <button
        onClick={onWithdraw}
        disabled={withdrawing}
        className="px-4 py-2.5 min-h-[44px] bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        {withdrawing ? 'Wird zurückgezogen...' : 'Angebot zurückziehen'}
      </button>
    </div>
  )
}
