'use client'

import {
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { getCategoryLabel, VERIFICATION_CONFIG } from '@/config/marketplace'
import { getConditionCriteria } from '@/config/marketplace/condition-criteria'
import { formatDateShort } from '@/lib/date-formats'
import ListingReviews from '@/components/marketplace/ListingReviews'
import { CO2Badge } from '@/components/marketplace/CO2Badge'
import type { ListingDetail } from './types'
import { useTranslations } from 'next-intl'

interface ListingDetailsProps {
  listing: ListingDetail
  isVerified: boolean
}

export function ListingDetails({ listing, isVerified }: ListingDetailsProps) {
  const t = useTranslations('marketplace.listing')
  const conditionCriteria = getConditionCriteria(listing.category, listing.condition)

  return (
    <>
      {/* CO2 Impact Badge */}
      <div className="mt-8">
        <CO2Badge category={listing.category} />
      </div>

      {/* Description */}
      <div className="mt-4 card-shell p-6">
        <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-3">{t('description')}</Heading>
        <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-line text-sm">
          {listing.description}
        </div>
      </div>

      {/* Technische Daten (Specs) */}
      {listing.specs && listing.specs.length > 0 && (
        <div className="mt-6 card-shell p-6">
          <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-neutral-400" aria-hidden="true" />
            {t('technicalData')}
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {listing.specs.filter(s => s.value).map(spec => (
              <div key={spec.key} className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{spec.key}</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Details */}
      {isVerified && (
        <div className={`mt-6 rounded-xl p-6 border ${VERIFICATION_CONFIG.badge.borderColor} bg-primary-50 dark:bg-primary-900/10`}>
          <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" aria-hidden="true" />
            {VERIFICATION_CONFIG.badge.label}
          </Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            {t('verifiedOn', { date: formatDateShort(listing.verified_at!) })}
          </p>
          {listing.verification_notes && (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2 whitespace-pre-line">
              {listing.verification_notes}
            </p>
          )}
        </div>
      )}

      {/* Condition Criteria */}
      {conditionCriteria && conditionCriteria.length > 0 && (
        <div className="mt-6 card-shell p-6">
          <Heading level={2} className="text-base text-neutral-900 dark:text-white mb-3">
            {t('conditionMeaningFor', { condition: ZUSTAND_OPTIONS.find(o => o.value === listing.condition)?.label || listing.condition, category: getCategoryLabel(listing.category) })}
          </Heading>
          <ul className="space-y-1.5">
            {conditionCriteria.map(c => (
              <li key={c.key} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <span className="text-primary-500 mt-0.5">&#10003;</span>
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
