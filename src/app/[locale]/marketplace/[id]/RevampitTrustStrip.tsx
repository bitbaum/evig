'use client'

/**
 * Trust strip for RevampIT (is_revampit) listings — the org's real
 * differentiators over a generic used-goods ad: CO₂ avoided (sourced and
 * linked to the methodology via CO2Badge), staff-verified status, the
 * non-profit reuse mission, and the refurbished-stock guarantee.
 *
 * The warranty/return figures come from the org's STATED policy (config
 * REVAMPIT_GUARANTEE — sourced from the intake warranty label + AGB), never
 * invented, and only ever on is_revampit stock (P2P sales carry no guarantee).
 */
import { ShieldCheck, Recycle, BadgeCheck, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CO2Badge } from '@/components/marketplace/CO2Badge'
import { REVAMPIT_GUARANTEE } from '@/config/marketplace'
import type { ListingDetail } from './types'

export function RevampitTrustStrip({
  listing,
  isVerified,
}: {
  listing: ListingDetail
  isVerified: boolean
}) {
  const t = useTranslations('marketplace.listing')

  if (!listing.is_revampit) return null

  return (
    <div className="card-shell space-y-3 p-4">
      <CO2Badge category={listing.category} />
      <ul className="space-y-1.5 text-sm text-text-secondary">
        {isVerified && (
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
            {t('trust.verified')}
          </li>
        )}
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
          {t('trust.warranty', { months: REVAMPIT_GUARANTEE.warrantyMonths })}
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
          {t('trust.returnPolicy', { days: REVAMPIT_GUARANTEE.returnDays })}
        </li>
        <li className="flex items-center gap-2">
          <Recycle className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
          {t('trust.mission')}
        </li>
      </ul>
    </div>
  )
}
