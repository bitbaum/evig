'use client'

import {
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { getCategoryLabel, VERIFICATION_CONFIG } from '@/config/marketplace'
import { getConditionCriteria } from '@/config/marketplace/condition-criteria'
import { formatDateShort } from '@/lib/date-formats'
import ListingReviews from '@/components/marketplace/ListingReviews'
import type { ListingDetail } from './types'

interface ListingDetailsProps {
  listing: ListingDetail
  isVerified: boolean
}

export function ListingDetails({ listing, isVerified }: ListingDetailsProps) {
  const conditionCriteria = getConditionCriteria(listing.category, listing.condition)

  return (
    <>
      {/* Description */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Beschreibung</h2>
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">
          {listing.description}
        </div>
      </div>

      {/* Technische Daten (Specs) */}
      {listing.specs && listing.specs.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gray-400" aria-hidden="true" />
            Technische Daten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {listing.specs.filter(s => s.value).map(spec => (
              <div key={spec.key} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">{spec.key}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Details */}
      {isVerified && (
        <div className={`mt-6 rounded-xl p-6 shadow-sm border ${VERIFICATION_CONFIG.badge.borderColor} bg-green-50 dark:bg-green-900/10`}>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" aria-hidden="true" />
            {VERIFICATION_CONFIG.badge.label}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Geprüft am {formatDateShort(listing.verified_at!)}
          </p>
          {listing.verification_notes && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">
              {listing.verification_notes}
            </p>
          )}
        </div>
      )}

      {/* Condition Criteria */}
      {conditionCriteria && conditionCriteria.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            Was bedeutet &quot;{ZUSTAND_OPTIONS.find(o => o.value === listing.condition)?.label || listing.condition}&quot; für {getCategoryLabel(listing.category)}?
          </h2>
          <ul className="space-y-1.5">
            {conditionCriteria.map(c => (
              <li key={c.key} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-6">
        <ListingReviews listingId={listing.id} sellerId={listing.seller_id} />
      </div>
    </>
  )
}
