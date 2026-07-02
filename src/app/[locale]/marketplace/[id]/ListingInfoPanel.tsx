'use client'

import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { DELIVERY_LABELS, PAYMENT_MODE_LABELS, formatCHF, getCategoryLabel, GRATIS_CONFIG, VERIFICATION_CONFIG } from '@/config/marketplace'
import type { DeliveryOption, PaymentMode } from '@/config/marketplace'
import type { ListingDetail } from './types'
import { ORG } from '@/config/org'
import { useTranslations } from 'next-intl'

interface ListingInfoPanelProps {
  listing: ListingDetail
  isVerified: boolean
  isGratis: boolean
}

export function ListingInfoPanel({ listing, isVerified, isGratis }: ListingInfoPanelProps) {
  const t = useTranslations('marketplace.listing')
  const conditionBadge = getConditionBadge(listing.condition)

  return (
    <>
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${conditionBadge.color}`}>
          {conditionBadge.label}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-raised text-text-secondary">
          {getCategoryLabel(listing.category)}
        </span>
        {isVerified && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${VERIFICATION_CONFIG.badge.color}`}>
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {VERIFICATION_CONFIG.badge.label}
          </span>
        )}
        {listing.is_revampit && !isVerified && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-action-muted text-action">
            {ORG.name}
          </span>
        )}
        {isGratis && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${GRATIS_CONFIG.color}`}>
            {GRATIS_CONFIG.label}
          </span>
        )}
      </div>

      {/* Title & Price */}
      <div>
        <Heading level={1} className="text-2xl lg:text-3xl text-text-primary mb-2">
          {listing.title}
        </Heading>
        <p className={`text-3xl font-bold ${isGratis ? GRATIS_CONFIG.priceColor : 'text-action'}`}>
          {formatCHF(Number(listing.price_chf))}
        </p>
      </div>

      {/* Details Table */}
      <div className="card-shell p-4 space-y-3">
        {listing.brand && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">{t('brand')}</span>
            <span className="font-medium text-text-primary">{listing.brand}</span>
          </div>
        )}
        {listing.model && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">{t('model')}</span>
            <span className="font-medium text-text-primary">{listing.model}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-tertiary flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" aria-hidden="true" /> {t('delivery')}
          </span>
          <span className="font-medium text-text-primary">
            {DELIVERY_LABELS[listing.delivery_options as DeliveryOption] || listing.delivery_options}
          </span>
        </div>
        {listing.shipping_cost_chf != null && listing.delivery_options !== 'pickup' && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">{t('shippingCost')}</span>
            <span className="font-medium text-text-primary">{formatCHF(Number(listing.shipping_cost_chf))}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-tertiary flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> {t('payment')}
          </span>
          <span className="font-medium text-text-primary">
            {PAYMENT_MODE_LABELS[listing.payment_mode as PaymentMode] || listing.payment_mode}
          </span>
        </div>
        {listing.pickup_location && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {t('location')}
            </span>
            <span className="font-medium text-text-primary">{listing.pickup_location}</span>
          </div>
        )}
      </div>
    </>
  )
}
