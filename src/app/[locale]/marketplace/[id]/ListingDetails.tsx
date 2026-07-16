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
import ListingQuestions from '@/components/marketplace/ListingQuestions'
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
        <Heading level={2} className="text-lg text-text-primary mb-3">{t('description')}</Heading>
        <div className="prose dark:prose-invert max-w-none text-text-secondary whitespace-pre-line text-sm">
          {listing.description}
        </div>
      </div>

      {/* Technische Daten (Specs) */}
      {listing.specs && listing.specs.length > 0 && (
        <div className="mt-6 card-shell p-6">
          <Heading level={2} className="text-lg text-text-primary mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-text-muted" aria-hidden="true" />
            {t('technicalData')}
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {listing.specs.filter(s => s.value).map(spec => (
              <div key={spec.key} className="flex justify-between py-1.5 border-b border-subtle last:border-0">
                <span className="text-sm text-text-tertiary">{spec.key}</span>
                <span className="text-sm font-medium text-text-primary">
                  {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Details — incl. the QC checks performed at intake */}
      {isVerified && (
        <div className={`mt-6 rounded-xl p-6 border ${VERIFICATION_CONFIG.badge.borderColor} bg-action-muted`}>
          <Heading level={2} className="text-lg text-text-primary mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-action" aria-hidden="true" />
            {VERIFICATION_CONFIG.badge.label}
          </Heading>
          <p className="text-sm text-text-secondary mb-1">
            {t('verifiedOn', { date: formatDateShort(listing.verified_at!) })}
          </p>
          {listing.verification_notes && (
            <p className="text-sm text-text-secondary mt-2 whitespace-pre-line">
              {listing.verification_notes}
            </p>
          )}
          {(listing.condition_checks?.filter(c => c.checked).length ?? 0) > 0 && (
            <>
              <p className="text-sm font-medium text-text-primary mt-3 mb-1.5">
                {t('performedChecks')}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {listing.condition_checks!.filter(c => c.checked).map(check => (
                  <li key={check.key} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-action mt-0.5" aria-hidden="true">&#10003;</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Condition Criteria */}
      {conditionCriteria && conditionCriteria.length > 0 && (
        <div className="mt-6 card-shell p-6">
          <Heading level={2} className="text-base text-text-primary mb-3">
            {t('conditionMeaningFor', { condition: ZUSTAND_OPTIONS.find(o => o.value === listing.condition)?.label || listing.condition, category: getCategoryLabel(listing.category) })}
          </Heading>
          <ul className="space-y-1.5">
            {conditionCriteria.map(c => (
              <li key={c.key} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-action mt-0.5">&#10003;</span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Public Q&A */}
      <div className="mt-6">
        <ListingQuestions listingId={listing.id} sellerId={listing.seller_id} />
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <ListingReviews listingId={listing.id} sellerId={listing.seller_id} />
      </div>
    </>
  )
}
